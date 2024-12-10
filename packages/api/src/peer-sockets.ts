import http from 'node:http';
import io from 'socket.io';

import { Logger } from './logger';
import { Function } from './function';

interface PeerSocketsOptions {
  readonly log: Logger;
  readonly server: http.Server;
}

interface PeerMessageEvent {

}

interface PeerState {
  readonly socket: io.Socket;
  readonly description: string;
}

interface Events {
  connect: Function<{
    readonly id: string;
    readonly name: string;
    readonly description: string;
  }, void>;
  disconnect: Function<{
    readonly id: string;
    readonly name: string;
    readonly description: string;
  }, void>;
}

export class PeerSockets {
  private readonly _log: Logger;
  private readonly _server: io.Server;
  private readonly _peers: Record<string, PeerState> = { };
  private readonly _handlers: Events = {
    connect: () => {},
    disconnect: () => {},
  };

  get list() {
    return Object.entries(this._peers).map(([name, peer]) => ({
      name,
      description: peer.description
    }));
  }

  constructor(options: PeerSocketsOptions) {
    this._log = options.log;
    this._server = new io.Server(options.server, {
      cors: { origin: '*' },
      path: '/edges'
    });

    this._server.on('connection', this._onConnect.bind(this));
  }

  on<Event extends keyof Events>(event: keyof Events, callback: Events[Event]) {
    this._handlers[event] = callback;
  }

  getByName(name: string) {
    return this._peers[name].socket;
  }

  private _onConnect(socket: io.Socket) {
    const name: string = socket.handshake.auth.name;
    const description: string = socket.handshake.auth.description;
    this._peers[name] = { socket, description };
    this._log.info(`peer "${name}" connected`);
    this._handlers.connect({
      id: socket.id,
      name,
      description
    });

    socket.on('message', this._onMessage(socket));
    socket.on('disconnect', this._onDisconnect(name, socket));
  }

  private _onDisconnect(name: string, socket: io.Socket) {
    return () => {
      this._log.warn(`peer "${name}" disconnected`);
      this._handlers.disconnect({
        id: socket.id,
        name,
        description: this._peers[socket.id].description
      });

      delete this._peers[socket.id];
    };
  }

  private _onMessage(_: io.Socket) {
    return (_: PeerMessageEvent) => {

    };
  }
}
