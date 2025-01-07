import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Cytoscape } from './cytoscape.component';

@NgModule({
  declarations: [Cytoscape],
  exports: [Cytoscape],
  imports: [CommonModule],
})
export class CytoscapeModule {}
