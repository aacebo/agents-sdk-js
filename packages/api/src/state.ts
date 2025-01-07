import * as uuid from 'uuid';

import { Function } from './function';

export class State<T> {
  get value() {
    return this._value;
  }
  private _value: T;

  private _subscriptions: Record<string, Function<T, void>> = {};

  constructor(value: T) {
    this._value = value;
  }

  next(value: T) {
    this._value = value;
    this.emit();
  }

  property<Key extends keyof T>(key: Key) {
    return new State<T[Key]>(this._value[key]);
  }

  subscribe(callback: Function<T, void>) {
    const id = uuid.v4();
    this._subscriptions[id] = callback;
    return id;
  }

  unsubscribe(...ids: string[]) {
    for (const id of ids) {
      delete this._subscriptions[id];
    }
  }

  protected emit() {
    for (const id in this._subscriptions) {
      this._subscriptions[id](this._value);
    }
  }
}
