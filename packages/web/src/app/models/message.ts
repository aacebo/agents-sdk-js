export interface Message {
  $meta?: {
    readonly $elapse: number;
  } & Omit<Record<string, any>, '$elapse'>;
  readonly id: string;
  readonly role: 'user' | 'system' | 'assistant';
  content: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
