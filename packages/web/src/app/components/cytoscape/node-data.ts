export interface NodeData {
  readonly id: string;
  readonly parent?: string;
  readonly name: string;
  readonly description?: string;
  readonly position: {
    readonly x: number;
    readonly y: number;
  };
  readonly status: string;
  readonly address?: string;
  readonly content: string;
  readonly size?: number;
  readonly outgoingEdges?: number;
  readonly weight: number;
  readonly fontSize: number;
}
