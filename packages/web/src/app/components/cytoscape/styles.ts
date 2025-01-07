import { Stylesheet } from 'cytoscape';
import { marked } from 'marked';
import { formatDuration } from 'date-fns';

import { NodeData } from './node-data';

export const STYLES: Stylesheet[] = [
  {
    selector: 'node',
    style: {
      color: '#fff',
      'text-wrap': 'wrap',
      'text-valign': 'center',
      label: (e: cytoscape.NodeSingular) => {
        return e.data().content;
      },
      'background-color': (e) => {
        return e.data().active ? '#008b6e' : 'gray';
      },
    },
  },
  {
    selector: 'node:selected',
    style: {
      'border-width': '1px',
      'border-color': 'yellow',
      color: 'yellow',
    },
  },
  {
    selector: 'node[fontSize]',
    style: {
      'font-size': 'data(fontSize)',
    },
  },
  {
    selector: 'node[weight]',
    style: {
      height: 'data(weight)',
      width: 'data(weight)',
    },
  },
  {
    selector: 'edge',
    style: {
      color: '#fff',
      width: '0.5px',
      'curve-style': 'bezier',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.5,
      label: (e: cytoscape.EdgeSingular) => {
        const elapse = (e.data() as any).elapse;

        if (elapse) {
          return formatDuration({ seconds: +elapse / 1000 });
        }

        return '';
      },
      'line-color': (e) => {
        return e.data().active ? '#008b6e' : 'gray';
      },
      'target-arrow-color': (e) => {
        return e.data().active ? '#008b6e' : 'gray';
      },
    },
  },
];
