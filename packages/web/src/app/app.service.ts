import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface AppInfo {
  readonly name: string;
  readonly description: string;
  readonly model: string;
  readonly prompt: string;
  readonly edges: Array<{
    readonly name: string;
    readonly description: string;
  }>;
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
