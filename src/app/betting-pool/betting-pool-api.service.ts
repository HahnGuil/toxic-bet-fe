import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthSessionService } from '../register/services/auth-session.service';

export interface BettingPoolUser {
  userName: string;
  points: number;
}

export interface BettingPoolResponse {
  bettingPoolId: number;
  bettingPoolKey: string;
  bettingPoolName: string;
  users: BettingPoolUser[];
}

@Injectable({ providedIn: 'root' })
export class BettingPoolApiService {
  private readonly baseUrl = `${environment.toxicBetApiBaseUrl}/bettingPool`;
  private readonly http = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);

  getUserPools(): Observable<BettingPoolResponse[]> {
    const token = this.authSessionService.getAccessToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`,
    });
    return this.http.get<BettingPoolResponse[]>(`${this.baseUrl}/getUsers`, { headers });
  }

  joinPool(bettingPoolKey: string): Observable<unknown> {
    const token = this.authSessionService.getAccessToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`,
    });
    return this.http.patch<unknown>(`${this.baseUrl}/${bettingPoolKey}`, null, { headers });
  }

  createPool(bettingPoolName: string): Observable<unknown> {
    const token = this.authSessionService.getAccessToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`,
      'Content-Type': 'application/json',
    });
    return this.http.post<unknown>(this.baseUrl, { bettingPoolName }, { headers });
  }
}
