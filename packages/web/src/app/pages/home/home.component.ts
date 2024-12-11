import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AppSocket, MessageEvent } from '../../app.socket';
import { AppState } from '../../app.state';

import { IconModule } from '../../components/icon';
import { HotKeyModule } from '../../components/hotkey';
import { MarkdownModule } from '../../components/markdown';
import { CytoscapeModule } from '../../components/cytoscape';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  host: { class: 'app-home' },
  imports: [
    CommonModule,
    FormsModule,
    IconModule,
    HotKeyModule,
    MarkdownModule,
    CytoscapeModule
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home {
  text = '';

  constructor(
    readonly state: AppState,
    private readonly _socket: AppSocket
  ) { }

  async send() {
    const text = this.text;
    this.text = '';

    const id = this._socket.send(
      text,
      this._onMessage.bind(this),
      this._onChunk.bind(this)
    );

    this.state.$messages.push({
      id,
      role: 'user',
      content: text,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  private _onMessage(e: MessageEvent) {
    let message = this.state.$messages.value.find(v => v.id === e.id);

    if (!message) {
      message = {
        ...e,
        role: 'assistant',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } else {
      message.$meta = e.$meta;
      message.content = e.content;
      message.updatedAt = new Date();
    }

    this.state.$messages.upsert(message, v => v.id === message.id);
  }

  private _onChunk(e: MessageEvent) {
    let message = this.state.$messages.value.find(v => v.id === e.id);

    if (!message) {
      message = {
        ...e,
        role: 'assistant',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } else {
      message.content += e.content;
      message.updatedAt = new Date();
    }

    this.state.$messages.upsert(message, v => v.id === message.id);
  }
}
