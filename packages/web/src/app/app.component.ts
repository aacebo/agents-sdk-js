import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  host: { class: 'app-root' },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  readonly state = new BehaviorSubject<any>(null);

  constructor(private readonly _http: HttpClient) { }

  async ngOnInit() {
    const res = await firstValueFrom(this._http.get<any>('/health'));
    this.state.next(res);
  }
}
