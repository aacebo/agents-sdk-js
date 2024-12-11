import { Injectable } from '@angular/core';
import io, { Socket } from 'socket.io-client';
import * as uuid from 'uuid';

export interface MessageEvent {
  readonly id: string;
  readonly content: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppSocket {
  private readonly _socket: Socket;

  constructor() {
    this._socket = io('/', {
      path: '/clients'
    });

    this._socket.on('connect', () => {
      console.info('connected...');
    });
  }

  send(text: string, onMessage?: (e: MessageEvent) => void, onChunk?: (e: MessageEvent) => void) {
    const id = uuid.v4();

    this._socket.on(`message.${id}.chunk`, (data: MessageEvent) => {
      if (!onChunk) return;
      onChunk(data);
    });

    this._socket.once(`message.${id}`, (data: MessageEvent) => {
      this._socket.off(`message.${id}.chunk`);
      if (!onMessage) return;
      onMessage(data);
    });

    this._socket.emit('message', {
      id,
      content: text
    });

    return id;
  }
}
