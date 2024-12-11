import { Stylesheet } from 'cytoscape';

export const STYLES: Stylesheet[] = [
  {
    selector: 'node',
    style: {
      color: '#fff',
      label: 'data(content)',
      'text-wrap': 'wrap',
      'text-valign': 'center',
      'background-color': '#008b6e'
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
    selector: 'node[size]',
    style: {
      'background-color': 'mapData(size, 0, 1024, blue, red)'
    }
  },
  {
    selector: 'node[outgoingEdges]',
    style: {
      'background-color': 'mapData(outgoingEdges, 0, 5, blue, red)'
    }
  },
  {
    selector: ':parent',
    style: {
      'text-valign': 'top',
      'background-opacity': 0.333
    }
  },
  {
    selector: 'edge',
    style: {
      width: '0.5px',
      'line-color': '#62efcd',
      'target-arrow-color': '#62efcd',
      'curve-style': 'bezier',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.5,
    }
  },
  {
    selector: 'edge[size]',
    style: {
      'line-color': 'mapData(size, 0, 1024, #62efcd, red)',
      'target-arrow-color': 'mapData(size, 0, 1024, #62efcd, red)'
    }
  },
  {
    selector: 'edge[outgoingEdges]',
    style: {
      'line-color': 'mapData(outgoingEdges, 0, 10, #62efcd, red)',
      'target-arrow-color': 'mapData(outgoingEdges, 0, 10, #62efcd, red)'
    }
  }
];
