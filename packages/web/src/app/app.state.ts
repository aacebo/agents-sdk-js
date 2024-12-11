import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, map } from 'rxjs';
import cytoscape from 'cytoscape';

import { AppInfo } from './app.service';
import { Agent, Message } from './models';

class ArrayBehaviorSubject<T> extends BehaviorSubject<Array<T>> {
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
  providedIn: 'root'
})
export class AppState {
  readonly $info = new BehaviorSubject<AppInfo | null>(null);
  readonly $messages = new ArrayBehaviorSubject<Message>([ ]);

  get $nodes() {
    return this.$info.pipe(
      filter(info => !!info),
      map(info => {
        const nodes: Array<cytoscape.NodeDefinition> = [];
        const queue: Array<Agent> = [info];
        const visited: Record<string, boolean> = { };

        while (queue.length) {
          const agent = queue.shift();

          if (!agent || visited[agent.name]) continue;

          nodes.push({
            group: 'nodes',
            selectable: true,
            data: {
              id: agent.name,
              // parent: info.name,
              name: agent.name,
              description: agent.description,
              content: agent.name,
              weight: 50,
              size: (agent.edges.length * 2) || 1,
              fontSize: 15,
              outgoingEdges: agent.edges.length,
            }
          });

          visited[agent.name] = true;
          queue.push(...agent.edges);
        }

        return nodes;
      })
    );
  }

  get $edges() {
    return this.$info.pipe(
      filter(info => !!info),
      map(info => {
        const edges: Array<cytoscape.EdgeDefinition> = [];
        const queue: Array<Agent> = [info];
        const visited: Record<string, boolean> = { };

        while (queue.length) {
          const agent = queue.shift();

          if (!agent || visited[agent.name]) continue;

          for (const edge of agent.edges) {
            edges.push({
              group: 'edges',
              selectable: false,
              data: {
                id: `${agent.name} -> ${edge.name}`,
                source: agent.name,
                target: edge.name,
                weight: 1
              }
            });
          }

          visited[agent.name] = true;
          queue.push(...agent.edges);
        }

        return edges;
      })
    );
  }
}
