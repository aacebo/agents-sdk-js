import { Stylesheet } from 'cytoscape';

export const STYLES: Stylesheet[] = [
  {
    selector: 'node',
    style: {
      color: '#fff',
      label: 'data(content)',
      'text-wrap': 'wrap',
      'text-valign': 'center',
      'background-color': (e) => {
        return e.data().active ? '#008b6e' : 'gray';
      }
    }
  },
  {
    selector: 'node:selected',
    style: {
      'border-width': '1px',
      'border-color': 'yellow',
      color: 'yellow'
    }
  },
  {
    selector: 'node[fontSize]',
    style: {
      'font-size': 'data(fontSize)'
    }
  },
  {
    selector: 'node[weight]',
    style: {
      height: 'data(weight)',
      width: 'data(weight)'
    }
  },
  {
    selector: 'edge',
    style: {
      width: '0.5px',
      'curve-style': 'bezier',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.5,
      'line-color': (e) => {
        return e.data().active ? '#008b6e' : 'gray';
      },
      'target-arrow-color': (e) => {
        return e.data().active ? '#008b6e' : 'gray';
      },
    }
  }
];
