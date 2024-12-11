import http from 'node:http';
import io from 'socket.io';

import { Logger } from './logger';
import { Function } from './function';
import { MessageEvent } from './message-event';
import { Edge } from './edge';

interface PeerSocketsOptions {
  readonly log: Logger;
  readonly server: http.Server;
}

interface PeerState {
  readonly socket: io.Socket;
  description: string;
  edges: Array<Edge>;
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
  change: Function<Array<Edge>, void>;
}

export class PeerSockets {
  private readonly _log: Logger;
  private readonly _server: io.Server;
  private readonly _peers: Record<string, PeerState> = { };
  private readonly _handlers: Events = {
    connect: () => {},
    disconnect: () => {},
    change: () => {}
  };

  get list() {
    return Object.entries(this._peers).map(([name, peer]) => ({
      name,
      description: peer.description,
      edges: peer.edges
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

  on<Event extends keyof Events>(event: Event, callback: Events[Event]) {
    this._handlers[event] = callback;
  }

  getByName(name: string) {
    return this._peers[name].socket;
  }

  private _onConnect(socket: io.Socket) {
    const name: string = socket.handshake.auth.name;
    const description: string = socket.handshake.auth.description;
    const edges: Array<Edge> = socket.handshake.auth.edges || [];
    this._peers[name] = { socket, description, edges };
    this._log.info(`peer "${name}" connected`);
    this._handlers.connect({
      id: socket.id,
      name,
      description
    });

    socket.on('message', this._onMessage(socket));
    socket.on('info', this._onInfo(socket));
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
    return (_: MessageEvent) => {

    };
  }

  private _onInfo(_: io.Socket) {
    return (e: Edge) => {
      const state = this._peers[e.name];
      state.description = e.description;
      state.edges = e.edges;
      this._peers[e.name] = state;
      this._handlers.change(this.list);
    };
  }
}
