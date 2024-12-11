import { Directive, ElementRef, Input } from '@angular/core';
import { marked } from 'marked';

@Directive({
  selector: '[agMarkdown]',
  standalone: false
})
export class Markdown {
  @Input()
  get agMarkdown() { return this._agMarkdown; }
  set agMarkdown(v) {
    this._agMarkdown = v;
    this.el.nativeElement.innerHTML = marked(v, { async: false });
  }
  private _agMarkdown: string;

  constructor(readonly el: ElementRef<HTMLElement>) { }
}
