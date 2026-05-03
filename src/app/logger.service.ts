import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

type LogLevel = 'info' | 'warn' | 'error';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly http = inject(HttpClient);
  private readonly url = '/log';

  info(message: string, data?: unknown): void {
    this.send('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.send('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.send('error', message, data);
  }

  private send(level: LogLevel, message: string, data?: unknown): void {
    this.http.post(this.url, { level, message, data }).subscribe();
  }
}
