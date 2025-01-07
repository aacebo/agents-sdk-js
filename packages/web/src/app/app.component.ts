import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppService } from './app.service';
import { AppSocket } from './app.socket';
import { AppState } from './app.state';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  host: { class: 'app-root' },
  imports: [CommonModule, RouterOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  constructor(
    private readonly _app: AppService,
    private readonly _state: AppState,
    private readonly _socket: AppSocket
  ) {}

  async ngOnInit() {
    const info = await this._app.getInfo();
    this._state.$info.next(info);
    document.title = info.name;
  }
}
