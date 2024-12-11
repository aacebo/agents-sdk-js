export interface Agent {
  readonly name: string;
  readonly description: string;
  readonly edges: Array<Agent>;
}
