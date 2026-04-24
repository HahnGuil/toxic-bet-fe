import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ToxicBetUserRequest, ToxicBetUserResponse } from './toxic-bet-user.models';

@Injectable({
  providedIn: 'root',
})
export class ToxicBetUserApiService {
  private readonly http = inject(HttpClient);
  private readonly toxicBetApiBaseUrl = environment.toxicBetApiBaseUrl;

  existsByEmail(userEmail: string): Observable<boolean> {
    const params = new HttpParams().set('userEmail', userEmail);

    return this.http.get<boolean>(`${this.toxicBetApiBaseUrl}/users/existsByEmail/`, { params });
  }

  registerUser(request: ToxicBetUserRequest): Observable<ToxicBetUserResponse> {
    return this.http.post<ToxicBetUserResponse>(`${this.toxicBetApiBaseUrl}/users`, request);
  }
}
