import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { AppInfo } from './app.service';

@Injectable({
  providedIn: 'root'
})
export class AppState {
  readonly $info = new BehaviorSubject<AppInfo | null>(null);
}
