import http from 'node:http';
import path from 'node:path';

import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import io from 'socket.io';
import * as uuid from 'uuid';

import { Agent, MessageEvent } from '@agents.sdk/core';

import { Logger } from './logger';
import { SocketServer } from './socket-server';
import { SocketClient } from './socket-client';
import { State } from './state';
import { ChatModel, FunctionDefinition } from './chat-model';

interface AppOptions {
  readonly port: number;
  readonly name: string;
  readonly description: string;
  readonly prompt: string;
  readonly model: string;
  readonly apiKey: string;
  readonly parent?: string;
}

interface AppState {
  name: string;
  description: string;
  prompt: string;
  model: string;
  agents: Record<string, Agent>;
}

export class App {
  readonly log: Logger;
  protected state: State<AppState>;
  protected chat: ChatModel;

  private readonly _server: http.Server;
  private readonly _messages: Record<string, Array<OpenAI.ChatCompletionMessageParam>> = {};
  private readonly _sockets: {
    parent?: SocketClient<Agent>;
    agents: SocketServer<Agent>;
    consoles: SocketServer<void>;
  };

  protected get functions() {
    const functions: Record<string, FunctionDefinition> = {};

    for (const agent of Object.values(this.state.value.agents)) {
      const callback = this.onAgentTool(agent.name);

      if (!callback) continue;

      functions[agent.name] = {
        description: agent.description,
        parameters: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'your message to the assistant',
            },
          },
          additionalProperties: false,
          required: ['content'],
        },
        callback,
      };
    }

    return functions;
  }

  constructor(readonly options: AppOptions) {
    const app = express();
    this.log = new Logger(options.name);
    this.chat = new ChatModel({ apiKey: options.apiKey });
    this.state = new State({
      name: options.name,
      description: options.description,
      prompt: options.prompt,
      model: options.model,
      agents: {},
    });

    app.use(express.json());
    app.use(cors());
    app.get('/health', this.onHealth.bind(this));
    app.use(express.static(path.join(__dirname, '../../web/dist/web/browser')));
    app.get('*', (_, res) => {
      res.sendFile(path.join(__dirname, '../../web/dist/web/browser/index.html'));
    });

    this._server = http.createServer(app);
    this._sockets = {
      agents: new SocketServer({
        log: this.log.fork('agents'),
        server: this._server,
        io: { path: '/agents' },
      }),
      consoles: new SocketServer({
        log: this.log.fork('consoles'),
        server: this._server,
        io: { path: '/consoles' },
      }),
    };

    if (options.parent) {
      this._sockets.parent = new SocketClient({
        log: this.log.fork('parent'),
        url: options.parent,
        name: options.name,
        options: { path: '/agents' },
      });

      this._sockets.parent.on('connect', () => {
        this._sockets.parent?.on('events.message', this.onParentMessage.bind(this));
      });

      setTimeout(() => {
        this._sockets.parent?.emit('state', {
          ...this.state.value,
          agents: Object.values(this.state.value.agents),
        });
      }, 1000);
    }

    this._sockets.agents.on('events.state', ({ event }) => {
      const state = this.state.value;
      state.agents[event.name] = event;
      this.state.next(state);
    });

    this.state.subscribe((state) => {
      this._sockets.parent?.emit('state', {
        ...state,
        agents: Object.values(state.agents),
      });
    });

    this._sockets.consoles.on('connect', this.onConsoleConnect.bind(this));
    this._sockets.consoles.on('disconnect', this.onConsoleDisconnect.bind(this));
    this._sockets.consoles.on('events.message', this.onConsoleMessage.bind(this));
  }

  listen(callback: () => void) {
    this._server.listen(this.options.port, callback);
  }

  protected onHealth(_: express.Request, res: express.Response) {
    res.json({
      ...this.state.value,
      agents: Object.values(this.state.value.agents),
    });
  }

  protected async onParentMessage(event: MessageEvent) {
    const start = new Date();
    const functions = this.functions;
    const res = await this.chat.send({
      id: event.id,
      functions,
      input: {
        role: 'user',
        content: event.content,
      },
      body: {
        temperature: 0,
        stream: false,
        model: this.options.model,
        messages: [
          {
            role: 'system',
            content: this.options.prompt,
          },
        ],
      },
    });

    this._sockets.parent?.emit(`message.${event.id}`, {
      $meta: {
        ...res.$meta,
        $elapse: new Date().getTime() - start.getTime(),
      },
      id: event.id,
      content: res.message.content,
    });
  }

  protected onConsoleConnect({ socket }: { socket: io.Socket }) {
    this._messages[socket.id] = [
      {
        role: 'system',
        content: this.options.prompt,
      },
    ];
  }

  protected onConsoleDisconnect({ socket }: { socket: io.Socket }) {
    delete this._messages[socket.id];
  }

  protected async onConsoleMessage({ socket, event }: { socket: io.Socket; event: MessageEvent }) {
    const start = new Date();
    const id = uuid.v4();
    const functions = this.functions;
    const res = await this.chat.send({
      id: id,
      functions,
      input: {
        role: 'user',
        content: event.content,
      },
      body: {
        temperature: 0,
        stream: true,
        model: this.state.value.model,
        messages: this._messages[socket.id],
      },
      onChunk: (chunk) => {
        socket.emit(`message.${event.id}.chunk`, {
          id: id,
          content: chunk.content,
        });
      },
    });

    this._messages[socket.id].push(res.message);
    socket.emit(`message.${event.id}`, {
      $meta: {
        ...res.$meta,
        $elapse: new Date().getTime() - start.getTime(),
      },
      id: id,
      content: res.message.content,
    });
  }

  protected onAgentTool(name: string) {
    const socket = this._sockets.agents.getByName(name);

    if (!socket) return;

    return (event: MessageEvent) => {
      return new Promise<MessageEvent>((resolve) => {
        socket.once(`message.${event.id}`, (e: MessageEvent) => {
          resolve(e);
        });

        socket.emit('message', event);
      });
    };
  }
}
