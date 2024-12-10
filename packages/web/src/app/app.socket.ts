import { Injectable } from '@angular/core';
import io, { Socket } from 'socket.io-client';
import * as uuid from 'uuid';

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

  send(text: string) {
    const id = uuid.v4();

    this._socket.once(`message.${id}`, (e) => {
      console.info(e);
    });

    this._socket.emit('message', {
      id,
      content: text
    });
  }
}
