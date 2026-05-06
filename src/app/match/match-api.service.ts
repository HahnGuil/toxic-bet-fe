import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { ApplicationTokenService } from '../register/services/application-token.service';
import { AuthSessionService } from '../register/services/auth-session.service';

export type CloseMatchResult = 'HOME_WIN' | 'DRAW' | 'VISITING_WIN';

export interface CloseMatchRequest {
  matchId: number;
  result: CloseMatchResult;
  homeTeamScore: number;
  visitingTeamScore: number;
}

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
  homeTeamScore?: number | null;
  visitingTeamScore?: number | null;
}

@Injectable({ providedIn: 'root' })
export class MatchApiService {
  private readonly baseUrl = `${environment.toxicBetApiBaseUrl}/match`;
  private readonly applicationTokenService = inject(ApplicationTokenService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly http = inject(HttpClient);

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

  streamInProgressMatches(): Observable<MatchResponse> {
    return this.withToken((token) =>
      this.createSseStream(`${this.baseUrl}/in-progress`, token),
    );
  }

  closeMatches(requests: CloseMatchRequest[]): Observable<void> {
    const token = this.authSessionService.getAccessToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`,
    });
    return this.http.patch<void>(this.baseUrl, requests, { headers });
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
        cache: 'no-store',
        headers: {
          Accept: 'text/event-stream',
          Authorization: `Bearer ${token}`,
        },
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
