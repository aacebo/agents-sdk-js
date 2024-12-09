import http from 'node:http';
import express from 'express';
import debug from 'debug';
import cors from 'cors';
import io from 'socket.io';
import ioClient, { Socket } from 'socket.io-client';

export interface AgentOptions {
  readonly port: number;
  readonly name: string;
  readonly prompt: string;
  readonly model: string;
  readonly apiKey: string;
  readonly parent?: string;
}

export class Agent {
  readonly log: debug.Debugger;
  private readonly _parent?: Socket;
  private readonly _server: http.Server;
  private readonly _agentsServer: io.Server;
  private readonly _clientsServer: io.Server;
  private readonly _sockets: Record<string, io.Socket> = { };

  constructor(readonly options: AgentOptions) {
    const app = express();

    app.use(express.json());
    app.use(cors());
    app.get('/', (_, res) => {
      res.json({
        name: options.name,
        prompt: options.prompt,
        model: options.model,
        parent: options.parent,
        sockets: Object.keys(this._sockets)
      });
    });

    this._server = http.createServer(app);
    this.log = debug(`agents/${options.name}`);
    this.log.enabled = true;
    this._agentsServer = new io.Server(this._server, {
      cors: { origin: '*' },
      path: '/agents'
    });

    this._clientsServer = new io.Server(this._server, {
      cors: { origin: '*' },
      path: '/clients'
    });

    this._agentsServer.on('connection', this._onAgentConnect.bind(this));
    this._clientsServer.on('connection', this._onClientConnect.bind(this));

    if (options.parent) {
      this._parent = ioClient(options.parent, {
        auth: { name: options.name },
        autoConnect: false,
        path: '/agents'
      });

      this._parent.on('connect', this._onParentConnect.bind(this));
      this._parent.connect();
    }
  }

  listen(callback: () => void) {
    this._server.listen(this.options.port, callback);
  }

  private _onAgentConnect(socket: io.Socket) {
    const name = socket.handshake.auth.name;
    this._sockets[name] = socket;
    this.log(`${name} connected...`);
  }

  private _onClientConnect(_: io.Socket) {
  }

  private _onParentConnect() {
    this.log('connected to parent...');
  }
}
