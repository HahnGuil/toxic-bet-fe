import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthSessionService } from '../register/services/auth-session.service';

export type BetResult = 'HOME_WIN' | 'DRAW' | 'VISITING_WIN';

export interface BetRequestDTO {
  matchId: number;
  result: BetResult;
  odds: number;
}

export interface BetResponseDTO {
  betId?: number;
  matchId?: number;
  result?: BetResult;
  odds?: number;
}

@Injectable({ providedIn: 'root' })
export class BetApiService {
  private readonly baseUrl = `${environment.toxicBetApiBaseUrl}/bet`;
  private readonly http = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);

  placeBet(request: BetRequestDTO): Observable<BetResponseDTO> {
    const token = this.authSessionService.getAccessToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`,
    });
    return this.http.post<BetResponseDTO>(this.baseUrl, request, { headers });
  }

  streamUserBets(): Observable<BetResponseDTO> {
    return new Observable((observer) => {
      const token = this.authSessionService.getAccessToken() ?? '';
      const controller = new AbortController();

      fetch(this.baseUrl, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok || !response.body) {
            observer.error(new Error(`Bet SSE failed: ${response.status}`));
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          const pump = (): Promise<void> =>
            reader.read().then(({ done, value }) => {
              if (done) { observer.complete(); return; }

              buffer += decoder.decode(value, { stream: true });
              const events = buffer.split('\n\n');
              buffer = events.pop() ?? '';

              for (const event of events) {
                for (const line of event.split('\n')) {
                  if (line.startsWith('data:')) {
                    try {
                      observer.next(JSON.parse(line.slice(5).trim()) as BetResponseDTO);
                    } catch { /* ignore malformed */ }
                  }
                }
              }
              return pump();
            });

          pump().catch((err: unknown) => {
            if (err instanceof Error && err.name !== 'AbortError') observer.error(err);
          });
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name !== 'AbortError') observer.error(err);
        });

      return () => controller.abort();
    });
  }
}
