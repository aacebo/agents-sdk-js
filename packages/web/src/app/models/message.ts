export interface Message {
  readonly id: string;
  readonly role: 'user' | 'system' | 'assistant';
  content: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
