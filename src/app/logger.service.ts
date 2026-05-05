import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

type LogLevel = 'info' | 'warn' | 'error';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly http = inject(HttpClient);
  private readonly url = '/log';

  info(message: string, data?: unknown): void {
    if (environment.production) {
      return;
    }

    this.send('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldSkipProductionStreamLog(message)) {
      return;
    }

    this.send('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    if (this.shouldSkipProductionStreamLog(message)) {
      return;
    }

    this.send('error', message, data);
  }

  private send(level: LogLevel, message: string, data?: unknown): void {
    this.http.post(this.url, { level, message, data }).subscribe();
  }

  private shouldSkipProductionStreamLog(message: string): boolean {
    return environment.production && message.startsWith('[Stream:');
  }
}
