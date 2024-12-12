import http from 'node:http';
import io from 'socket.io';
import { MessageEvent, MessageDeleteEvent } from '@agents.sdk/core';

import { Logger } from './logger';
import { Function } from './function';

export interface SocketServerOptions {
  readonly log: Logger;
  readonly server: http.Server;
  readonly io: Partial<io.ServerOptions>;
}

export interface SocketServerEvents<StateEvent> {
  connect: Function<{ readonly socket: io.Socket }, void>;
  disconnect: Function<{ readonly socket: io.Socket }, void>;
  'events.state': Function<{
    readonly socket: io.Socket;
    readonly event: StateEvent;
  }, void>;
  'events.message': Function<{
    readonly socket: io.Socket;
    readonly event: MessageEvent;
  }, void>;
  'events.message.chunk': Function<{
    readonly socket: io.Socket;
    readonly event: MessageEvent;
  }, void>;
  'events.message.delete': Function<{
    readonly socket: io.Socket;
    readonly event: MessageDeleteEvent;
  }, void>;
}

export class SocketServer<StateEvent> {
  private readonly _log: Logger;
  private readonly _server: io.Server;
  private readonly _sockets: Record<string, io.Socket> = { };
  private readonly _events: SocketServerEvents<StateEvent> = {
    connect: () => {},
    disconnect: () => {},
    'events.state': () => {},
    'events.message': () => {},
    'events.message.chunk': () => {},
    'events.message.delete': () => {}
  };

  constructor(options: SocketServerOptions) {
    this._log = options.log.fork('sockets');
    this._server = new io.Server(options.server, {
      cors: { origin: '*' },
      ...options.io
    });

    this._server.on('connection', this.onConnect.bind(this));
  }

  on<Event extends keyof SocketServerEvents<StateEvent>>(
    event: Event,
    callback: SocketServerEvents<StateEvent>[Event]
  ) {
    this._events[event] = callback;
  }

  getById(id: string) {
    return this._sockets[id];
  }

  getByName(name: string) {
    return Object.values(this._sockets).find(s => s.handshake.auth.name === name);
  }

  protected onConnect(socket: io.Socket) {
    this._log.debug(`"${socket.id}" connected`);
    this._sockets[socket.id] = socket;
    this._events.connect({ socket });

    socket.on('disconnect', this.onDisconnect(socket));
    socket.on('state', this.onState(socket));
    socket.on('message', this.onMessage(socket));
    socket.on('message.chunk', this.onMessageChunk(socket));
    socket.on('message.delete', this.onMessageDelete(socket));
  }

  protected onDisconnect(socket: io.Socket) {
    return () => {
      this._log.debug(`"${socket.id}" disconnected`);
      delete this._sockets[socket.id];
      this._events.disconnect({ socket });
    };
  }

  protected onState(socket: io.Socket) {
    const log = this._log.fork('events:state');

    return (event: StateEvent) => {
      log.debug(event);
      this._events['events.state']({ socket, event });
    };
  }

  protected onMessage(socket: io.Socket) {
    const log = this._log.fork('events:message');

    return (event: MessageEvent) => {
      log.debug(event);
      this._events['events.message']({ socket, event });
    };
  }

  protected onMessageChunk(socket: io.Socket) {
    const log = this._log.fork('events:message:chunk');

    return (event: MessageEvent) => {
      log.debug(event);
      this._events['events.message.chunk']({ socket, event });
    };
  }

  protected onMessageDelete(socket: io.Socket) {
    const log = this._log.fork('events:message:delete');

    return (event: MessageDeleteEvent) => {
      log.debug(event);
      this._events['events.message.delete']({ socket, event });
    };
  }
}
