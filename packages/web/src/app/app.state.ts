import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, map, withLatestFrom } from 'rxjs';
import cytoscape from 'cytoscape';

import { Agent, Message, Meta } from '@agents.sdk/core';

class ArrayBehaviorSubject<T> extends BehaviorSubject<Array<T>> {
  get last() {
    return this.pipe(
      map((v) => {
        if (v.length === 0) return;
        return v[v.length - 1];
      })
    );
  }

  push(...items: T[]) {
    const value = this.value;
    value.push(...items);
    this.next(value);
  }

  update(item: T, predicate: (value: T, index: number, obj: T[]) => boolean) {
    const value = this.value;
    const i = value.findIndex(predicate);

    if (i < 0) return;

    value[i] = item;
    this.next(value);
  }

  remove(predicate: (value: T, index: number, obj: T[]) => boolean) {
    const value = this.value;
    const i = value.findIndex(predicate);

    if (i < 0) return;

    value.splice(i, 1);
    this.next(value);
  }

  upsert(item: T, predicate: (value: T, index: number, obj: T[]) => boolean) {
    const value = this.value;
    const i = value.findIndex(predicate);

    if (i < 0) {
      value.push(item);
    } else {
      value[i] = item;
    }

    this.next(value);
  }
}

@Injectable({
  providedIn: 'root',
})
export class AppState {
  readonly $info = new BehaviorSubject<Agent | null>(null);
  readonly $messages = new ArrayBehaviorSubject<Message>([]);

  get $nodes() {
    return this.$info.pipe(
      filter((info) => !!info),
      withLatestFrom(this.$messages.last),
      map(([info, message]) => {
        const nodes: Array<cytoscape.NodeDefinition> = [];
        const queue: Array<Agent> = [info];
        const metaQueue: Array<Meta | undefined> = [message?.$meta];
        const visited: Record<string, boolean> = {};

        while (queue.length) {
          const agent = queue.shift();
          const $meta = metaQueue.shift();

          if (!agent || visited[agent.name]) continue;

          nodes.push({
            group: 'nodes',
            selectable: false,
            data: {
              id: agent.name,
              active: !!$meta,
              name: agent.name,
              description: agent.description,
              content: agent.name,
              weight: 50,
              size: agent.agents.length * 2 || 1,
              fontSize: 15,
              elapse: $meta?.$elapse,
              outgoingEdges: agent.agents.length,
            },
          });

          visited[agent.name] = true;
          queue.push(...agent.agents);

          for (const edge of agent.agents) {
            metaQueue.push(($meta || ({} as any))[edge.name]);
          }
        }

        return nodes;
      })
    );
  }

  get $edges() {
    return this.$info.pipe(
      filter((info) => !!info),
      withLatestFrom(this.$messages.last),
      map(([info, message]) => {
        const edges: Array<cytoscape.EdgeDefinition> = [];
        const queue: Array<Agent> = [info];
        const metaQueue: Array<Meta | undefined> = [message?.$meta];
        const visited: Record<string, boolean> = {};

        while (queue.length) {
          const agent = queue.shift();
          const $meta = metaQueue.shift();

          if (!agent || visited[agent.name]) continue;

          for (const edge of agent.agents) {
            edges.push({
              group: 'edges',
              selectable: false,
              data: {
                id: `${agent.name} -> ${edge.name}`,
                source: agent.name,
                target: edge.name,
                weight: 1,
                elapse: ($meta || ({} as any))[edge.name]?.$elapse,
                active: !!($meta || ({} as any))[edge.name],
              },
            });
          }

          visited[agent.name] = true;
          queue.push(...agent.agents);

          for (const edge of agent.agents) {
            metaQueue.push(($meta || ({} as any))[edge.name]);
          }
        }

        return edges;
      })
    );
  }
}
