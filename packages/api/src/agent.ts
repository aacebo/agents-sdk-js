import http from 'node:http';
import path from 'node:path';

import express from 'express';
import cors from 'cors';
import ioClient, { Socket } from 'socket.io-client';
import * as uuid from 'uuid';

import { Logger } from './logger';
import { PeerSockets } from './peer-sockets';
import { ClientSockets } from './client-sockets';
import { MessageEvent } from './message-event';
import { ChatModel } from './chat-model';

interface AgentOptions {
  readonly port: number;
  readonly name: string;
  readonly description: string;
  readonly prompt: string;
  readonly model: string;
  readonly apiKey: string;
  readonly parent?: string;
}

export class Agent {
  readonly log: Logger;
  private readonly _parent?: Socket;
  private readonly _server: http.Server;
  private readonly _chat: ChatModel;
  private readonly _peers: PeerSockets;
  private readonly _clients: ClientSockets;

  constructor(readonly options: AgentOptions) {
    const app = express();
    this.log = new Logger(`@agent/${options.name}`);
    this._chat = new ChatModel({ apiKey: options.apiKey });

    app.use(express.json());
    app.use(cors());
    app.get('/health', (_, res) => {
      res.json({
        name: options.name,
        description: options.description,
        prompt: options.prompt,
        model: options.model,
        parent: options.parent,
        edges: this._peers.list,
      });
    });

    app.use(express.static(path.join(__dirname, '../../web/dist/web/browser')));
    app.get('*', (_, res) => {
      res.sendFile(path.join(__dirname, '../../web/dist/web/browser/index.html'));
    });

    this._server = http.createServer(app);
    this._peers = new PeerSockets({
      log: this.log,
      server: this._server,
    });

    this._clients = new ClientSockets({
      log: this.log,
      server: this._server,
      chat: {
        clientOptions: { apiKey: options.apiKey },
        model: options.model,
        prompt: options.prompt
      }
    });

    this._peers.on('connect', (e) => {
      this._clients.functions.add(e.name, e.description, ({ id, content }) => new Promise<MessageEvent>((resolve) => {
        const socket = this._peers.getByName(e.name);

        socket.once(`message.${id}`, (e: MessageEvent) => {
          resolve(e);
        });

        socket.emit('message', { id, content });
      }));
    });

    this._peers.on('disconnect', (e) => {
      this._clients.functions.remove(e.name);
    });

    this._peers.on('change', (edges) => {
      if (!this._parent) return;
      this._parent.emit('info', {
        name: options.name,
        description: options.description,
        edges
      });
    });

    if (options.parent) {
      this._parent = ioClient(options.parent, {
        autoConnect: false,
        path: '/edges',
        auth: {
          name: options.name,
          description: options.description,
          edges: this._peers.list
        }
      });

      this._parent.on('connect', () => {
        this.log.info('connected to parent...');
        this._parent!.on('message', this._onMessage(this._parent!));

        setInterval(() => {
          this._parent?.emit('info', {
            name: options.name,
            description: options.description,
            edges: this._peers.list
          });
        }, 1000);
      });

      this._parent.connect();
    }
  }

  listen(callback: () => void) {
    this._server.listen(this.options.port, callback);
  }

  private _onMessage(socket: Socket) {
    return async (e: MessageEvent) => {
      const id = uuid.v4();
      const start = new Date();
      const res = await this._chat.send({
        id,
        functions: this._clients.functions.get(),
        input: {
          role: 'user',
          content: e.content
        },
        body: {
          temperature: 0,
          model: this.options.model,
          messages: [
            {
              role: 'system',
              content: this.options.prompt
            }
          ],
        },
        onChunk: (chunk) => {
          socket.emit(`message.${e.id}.chunk`, {
            id,
            content: chunk.content
          });
        }
      });

      socket.emit(`message.${e.id}`, {
        $meta: {
          ...res.$meta,
          $elapse: new Date().getTime() - start.getTime()
        },
        id,
        content: res.message.content
      });
    };
  }
}
