export type Meta = {
  readonly $elapse: number;
} & Omit<Record<string, any>, '$elapse'>;

export interface Message {
  $meta?: Meta;
  readonly id: string;
  readonly role: 'user' | 'system' | 'assistant';
  content: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
