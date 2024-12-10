import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

import { AppInfo, AppService } from './app.service';
import { AppSocket } from './app.socket';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  host: { class: 'app-root' },
  imports: [CommonModule, RouterOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  readonly info = new BehaviorSubject<AppInfo | null>(null);

  constructor(
    private readonly _app: AppService,
    private readonly _socket: AppSocket
  ) { }

  async ngOnInit() {
    const info = await this._app.getInfo();
    this.info.next(info);
  }
}
