import { Meta } from '../message';

export interface MessageEvent {
  readonly $meta?: Meta;
  readonly id: string;
  readonly content: string;
}

export interface MessageDeleteEvent {
  readonly id: string;
}
