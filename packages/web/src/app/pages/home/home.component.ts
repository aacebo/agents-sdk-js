import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IconModule } from '../../components/icon';
import { AppSocket } from '../../app.socket';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  host: { class: 'app-home' },
  imports: [FormsModule, IconModule],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home {
  text = '';

  constructor(private readonly _socket: AppSocket) { }

  send() {
    this._socket.send(this.text);
  }
}
