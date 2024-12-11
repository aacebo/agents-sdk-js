import { ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, ViewEncapsulation } from '@angular/core';
import { coerceNumberProperty } from '@angular/cdk/coercion';
import * as feathericons from 'feather-icons';

@Component({
  selector: 'ag-icon',
  template: '',
  styleUrl: './icon.component.scss',
  host: { class: 'ag-icon' },
  standalone: false,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Icon implements OnChanges {
  @Input() name!: keyof (typeof feathericons.icons);

  @Input()
  get height() { return this._height; }
  set height(v: string | number) {
    this._height = coerceNumberProperty(v);
  }
  private _height = 25;

  @Input()
  get width() { return this._width; }
  set width(v: string | number) {
    this._width = coerceNumberProperty(v);
  }
  private _width = 25;

  @Input()
  get strokeWidth() { return this._strokeWidth; }
  set strokeWidth(v: string | number) {
    this._strokeWidth = coerceNumberProperty(v);
  }
  private _strokeWidth = 1.5;

  constructor(private readonly _el: ElementRef<HTMLElement>) { }

  ngOnChanges() {
    this._el.nativeElement.innerHTML = feathericons.icons[this.name].toSvg({
      style: 'margin-top: -3px;',
      width: this.width,
      height: this.height,
      'stroke-width': this.strokeWidth,
    });
  }
}
