import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Agent } from '@agents.sdk/core';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  constructor(private readonly _http: HttpClient) { }

  getInfo() {
    return firstValueFrom(this._http.get<Agent>('/health'));
  }
}
