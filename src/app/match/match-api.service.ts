import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { ApplicationTokenService } from '../register/services/application-token.service';

export type MatchResult =
  | 'HOME_WIN'
  | 'VISITING_WIN'
  | 'DRAW'
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'OPEN_FOR_BETTING';

export interface MatchResponse {
  matchId: number;
  homeTeamName: string;
  visitingTeamName: string;
  championshipId: number;
  championshipName: string;
  matchTime: string;
  result: MatchResult;
  homeTeamOdds: number;
  visitingTeamOdds: number;
  drawTeamOdds: number;
}

@Injectable({ providedIn: 'root' })
export class MatchApiService {
  private readonly baseUrl = `${environment.toxicBetApiBaseUrl}/match`;
  private readonly applicationTokenService = inject(ApplicationTokenService);

  streamAllMatches(): Observable<MatchResponse> {
    return this.withToken((token) =>
      this.createSseStream(this.baseUrl, token),
    );
  }

  streamMatchesByChampionship(championshipId: number): Observable<MatchResponse> {
    return this.withToken((token) =>
      this.createSseStream(`${this.baseUrl}/by-championship?championshipId=${championshipId}`, token),
    );
  }

  streamOpenBettingMatches(): Observable<MatchResponse> {
    return this.withToken((token) =>
      this.createSseStream(`${this.baseUrl}/find-open`, token),
    );
  }

  streamOpenBettingMatchesByChampionship(championshipId: number): Observable<MatchResponse> {
    return this.withToken((token) =>
      this.createSseStream(`${this.baseUrl}/open/by-championship?championshipId=${championshipId}`, token),
    );
  }

  private withToken(
    fn: (token: string) => Observable<MatchResponse>,
  ): Observable<MatchResponse> {
    return this.applicationTokenService.applicationToken$.pipe(
      filter((token): token is string => !!token),
      take(1),
      switchMap(fn),
    );
  }

  private createSseStream(url: string, token: string): Observable<MatchResponse> {
    return new Observable((observer) => {
      const controller = new AbortController();

      fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok || !response.body) {
            observer.error(new Error(`SSE request failed: ${response.status}`));
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          const pump = (): Promise<void> =>
            reader.read().then(({ done, value }) => {
              if (done) {
                observer.complete();
                return;
              }

              buffer += decoder.decode(value, { stream: true });
              const events = buffer.split('\n\n');
              buffer = events.pop() ?? '';

              for (const event of events) {
                for (const line of event.split('\n')) {
                  if (line.startsWith('data:')) {
                    try {
                      observer.next(
                        JSON.parse(line.slice(5).trim()) as MatchResponse,
                      );
                    } catch {
                      // ignore malformed SSE data
                    }
                  }
                }
              }

              return pump();
            });

          pump().catch((err: unknown) => {
            if (err instanceof Error && err.name !== 'AbortError') {
              observer.error(err);
            }
          });
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name !== 'AbortError') {
            observer.error(err);
          }
        });

      return () => controller.abort();
    });
  }
}
