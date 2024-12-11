export interface NodeData {
  readonly id: string;
  readonly parent?: string;
  readonly name: string;
  readonly description?: string;
  readonly content: string;
  readonly size?: number;
  readonly outgoingEdges?: number;
  readonly weight: number;
  readonly fontSize: number;
}
