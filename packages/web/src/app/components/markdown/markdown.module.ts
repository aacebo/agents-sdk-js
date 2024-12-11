import { NgModule } from '@angular/core';

import { Markdown } from './markdown.directive';

@NgModule({
  declarations: [Markdown],
  exports: [Markdown]
})
export class MarkdownModule { }
