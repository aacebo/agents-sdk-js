import http from 'node:http';
import io from 'socket.io';
import OpenAI, { ClientOptions } from 'openai';
import * as uuid from 'uuid';

import { Logger } from './logger';
import { ChatModel } from './chat-model';
import { ObjectSchema } from './schema';
import { Function } from './function';
import { MessageEvent } from './message-event';

interface ClientSocketsOptions {
  readonly log: Logger;
  readonly server: http.Server;
  readonly chat: {
    readonly clientOptions: ClientOptions;
    readonly model: string;
    readonly prompt: string;
  };
}

interface ClientState {
  readonly socket: io.Socket;
  readonly messages: Array<OpenAI.ChatCompletionMessageParam>;
}

export class ClientSockets {
  private readonly _log: Logger;
  private readonly _server: io.Server;
  private readonly _chat: ChatModel;
  private readonly _clients: Record<string, ClientState> = { };
  private readonly _functions: Record<string, {
    readonly description: string;
    readonly parameters?: ObjectSchema;
    readonly callback: Function<MessageEvent>;
  }> = { };

  constructor(private readonly _options: ClientSocketsOptions) {
    this._log = _options.log;
    this._chat = new ChatModel(this._options.chat.clientOptions);
    this._server = new io.Server(this._options.server, {
      cors: { origin: '*' },
      path: '/clients'
    });

    this._server.on('connection', this._onConnect.bind(this));
  }

  get functions() {
    return {
      get: () => this._functions,
      add: (name: string, description: string, callback: Function<MessageEvent, MessageEvent>) => {
        this._functions[name] = {
          description,
          parameters: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'your message to the assistant'
              }
            },
            additionalProperties: false,
            required: ['content'],
          },
          callback
        };
      },
      remove: (name: string) => {
        delete this._functions[name];
      }
    };
  }

  private _onConnect(socket: io.Socket) {
    this._log.info(`client "${socket.id}" connected`);
    this._clients[socket.id] = {
      socket,
      messages: [{
        role: 'system',
        content: this._options.chat.prompt
      }]
    };

    socket.on('message', this._onMessage(socket));
    socket.on('disconnect', this._onDisconnect(socket));
  }

  private _onDisconnect(socket: io.Socket) {
    return () => {
      this._log.warn(`client "${socket.id}" disconnected`);
      delete this._clients[socket.id];
    };
  }

  private _onMessage(socket: io.Socket) {
    return async (e: MessageEvent) => {
      const id = uuid.v4();
      const start = new Date();
      const res = await this._chat.send({
        id,
        functions: this._functions,
        input: {
          role: 'user',
          content: e.content
        },
        body: {
          temperature: 0,
          model: this._options.chat.model,
          messages: this._clients[socket.id].messages,
        },
        onChunk: (chunk) => {
          socket.emit(`message.${e.id}.chunk`, {
            id,
            content: chunk.content
          });
        }
      });

      this._clients[socket.id].messages.push(res.message);
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
