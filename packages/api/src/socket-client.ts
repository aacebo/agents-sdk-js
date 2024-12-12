import ioClient, { Socket, ManagerOptions, SocketOptions } from 'socket.io-client';

import { MessageEvent } from '@agents.sdk/core';

import { Function } from './function';
import { Logger } from './logger';

export interface SocketClientOptions {
  readonly log: Logger;
  readonly url: string;
  readonly name: string;
  readonly options?: Partial<ManagerOptions & SocketOptions>;
}

export interface SocketClientEvents<StateEvent> {
  connect: Function<void, void>;
  disconnect: Function<void, void>;
  'events.state': Function<StateEvent, void>;
  'events.message': Function<MessageEvent, void>;
}

export class SocketClient<StateEvent> {
  private readonly _log: Logger;
  private readonly _client: Socket;
  private readonly _events: SocketClientEvents<StateEvent> = {
    connect: () => {},
    disconnect: () => {},
    'events.state': () => {},
    'events.message': () => {}
  };

  constructor(options: SocketClientOptions) {
    this._log = options.log;
    this._client = ioClient(options.url, {
      ...options.options,
      auth: { name: options.name }
    });

    this._client.on('connect', this.onConnect.bind(this));
  }

  on<Event extends keyof SocketClientEvents<StateEvent>>(
    event: Event,
    callback: SocketClientEvents<StateEvent>[Event]
  ) {
    this._events[event] = callback;
  }

  emit(event: string, payload: any) {
    this._client.emit(event, payload);
  }

  protected onConnect() {
    this._log.debug('connected');
    this._events.connect();
    this._client.on('disconnect', this.onDisconnect.bind(this));
    this._client.on('state', this.onState());
    this._client.on('message', this.onMessage());
  }

  protected onDisconnect() {
    this._log.debug('disconnected');
    this._events.disconnect();
  }

  protected onState() {
    const log = this._log.fork('events:state');

    return (event: StateEvent) => {
      log.debug(event);
      this._events['events.state'](event);
    };
  }

  protected onMessage() {
    const log = this._log.fork('events:message');

    return (event: MessageEvent) => {
      log.debug(event);
      this._events['events.message'](event);
    };
  }
}
