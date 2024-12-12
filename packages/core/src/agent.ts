export interface Agent {
  readonly name: string;
  readonly description: string;
  readonly prompt: string;
  readonly model: string;
  readonly agents: Array<Agent>;
}
