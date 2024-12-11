import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Agent } from './models';

export interface AppInfo {
  readonly name: string;
  readonly description: string;
  readonly model: string;
  readonly prompt: string;
  readonly edges: Array<Agent>;
}

@Injectable({
  providedIn: 'root'
})
export class AppService {
  constructor(private readonly _http: HttpClient) { }

  getInfo() {
    return firstValueFrom(this._http.get<AppInfo>('/health'));
  }
}
