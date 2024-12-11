export interface MessageEvent {
  readonly $meta?: Record<string, any>;
  readonly id: string;
  readonly content: string;
}
