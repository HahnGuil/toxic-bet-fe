import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { AuthSessionService } from '../register/services/auth-session.service';

export type MatchResult = 'HOME_WIN' | 'VISITING_WIN' | 'DRAW';

export interface BetResultDTO {
  homeTeamName: string;
  visitingTeamName: string;
  matchResult: MatchResult;
  betResult: MatchResult;
  betOdds: number;
  winner: boolean;
}

@Injectable({ providedIn: 'root' })
export class BetResultsApiService {
  private readonly url = `${environment.toxicBetApiBaseUrl}/bet/results`;
  private readonly http = inject(HttpClient);
  private readonly authSession = inject(AuthSessionService);

  getBetResults(): Observable<BetResultDTO[] | null> {
    const token = this.authSession.getAccessToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token ?? ''}` });
    return this.http.get<BetResultDTO[]>(this.url, { headers }).pipe(
      catchError(() => of(null)),
    );
  }
}
