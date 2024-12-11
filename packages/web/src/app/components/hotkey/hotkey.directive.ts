import { Directive, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import mousetrap from 'mousetrap';

@Directive({
  selector: '[agHotKey]',
  standalone: false
})
export class HotKey {
  @Input()
  get agHotKey() { return this._agHotKey; }
  set agHotKey(v) {
    if (this._agHotKey) {
      this._mousetrap.unbind(this._agHotKey);
    }

    this._mousetrap.bind(v, this._onTriggered.bind(this));
    this._agHotKey = v;
  }
  private _agHotKey: string;

  @Output()
  readonly agHotKeyPressed = new EventEmitter<KeyboardEvent>();

  private readonly _mousetrap: mousetrap.MousetrapInstance;

  constructor(readonly el: ElementRef<HTMLElement>) {
    this._mousetrap = mousetrap(el.nativeElement);
    this._mousetrap.stopCallback = () => false;
  }

  private _onTriggered(e: KeyboardEvent) {
    this.agHotKeyPressed.emit(e);
  }
}
