import http from 'node:http';
import express from 'express';
import cors from 'cors';
import ioClient, { Socket } from 'socket.io-client';
import * as uuid from 'uuid';

import { Logger } from './logger';
import { PeerSockets } from './peer-sockets';
import { ClientSockets } from './client-sockets';

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
  private readonly _peers: PeerSockets;
  private readonly _clients: ClientSockets;

  constructor(readonly options: AgentOptions) {
    const app = express();
    this.log = new Logger(`@agent/${options.name}`);

    app.use(express.json());
    app.use(cors());
    app.get('/', (_, res) => {
      res.json({
        name: options.name,
        prompt: options.prompt,
        model: options.model,
        parent: options.parent,
        edges: Object.keys(this._peers.list),
      });
    });

    if (options.parent) {
      this._parent = ioClient(options.parent, {
        autoConnect: false,
        path: '/edges',
        auth: {
          name: options.name,
          description: options.description
        }
      });

      this._parent.on('connect', () => this.log.info('connected to parent'));
      this._parent.connect();
    }

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
      this._clients.functions.add(e.name, e.description, ({ text }) => new Promise<string>((resolve) => {
        const id = uuid.v4();
        const socket = this._peers.getByName(e.name);

        socket.once(`message.${id}`, ({ content }: { content: string }) => {
          resolve(content);
        });

        socket.emit('message', { id, content: text });
      }));
    });

    this._peers.on('disconnect', (e) => {
      this._clients.functions.remove(e.name);
    });
  }

  listen(callback: () => void) {
    this._server.listen(this.options.port, callback);
  }
}
