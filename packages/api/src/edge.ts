export interface Edge {
  readonly name: string;
  readonly description: string;
  readonly edges: Array<Edge>;
}
