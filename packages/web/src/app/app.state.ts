import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { AppInfo } from './app.service';
import { Message } from './models';

class ArrayBehaviorSubject<T> extends BehaviorSubject<Array<T>> {
  push(...items: T[]) {
    const value = this.value;
    value.push(...items);
    this.next(value);
  }

  update(item: T, predicate: (value: T, index: number, obj: T[]) => boolean) {
    const value = this.value;
    const i = value.findIndex(predicate);

    if (i < 0) return;

    value[i] = item;
    this.next(value);
  }

  remove(predicate: (value: T, index: number, obj: T[]) => boolean) {
    const value = this.value;
    const i = value.findIndex(predicate);

    if (i < 0) return;

    value.splice(i, 1);
    this.next(value);
  }

  upsert(item: T, predicate: (value: T, index: number, obj: T[]) => boolean) {
    const value = this.value;
    const i = value.findIndex(predicate);

    if (i < 0) {
      value.push(item);
    } else {
      value[i] = item;
    }

    this.next(value);
  }
}

@Injectable({
  providedIn: 'root'
})
export class AppState {
  readonly $info = new BehaviorSubject<AppInfo | null>(null);
  readonly $messages = new ArrayBehaviorSubject<Message>([ ]);
}
