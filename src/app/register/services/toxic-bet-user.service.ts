import { HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, mapTo, of, switchMap } from 'rxjs';

import { ToxicBetUserApiService } from './toxic-bet-user-api.service';

@Injectable({
  providedIn: 'root',
})
export class ToxicBetUserService {
  private readonly toxicBetUserApiService = inject(ToxicBetUserApiService);

  existsByEmailWithToken(email: string, token: string): import('rxjs').Observable<boolean> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.toxicBetUserApiService.existsByEmailWithHeaders(email, headers);
  }

  registerUserWithToken(userName: string, email: string, token: string): import('rxjs').Observable<void> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.toxicBetUserApiService.registerUserWithHeaders({ name: userName, email }, headers).pipe(mapTo(void 0));
  }

  ensureRegistered(userName: string, email: string): Observable<void> {
    return this.toxicBetUserApiService.existsByEmail(email).pipe(
      switchMap((userExists) => {
        if (userExists) {
          return of(void 0);
        }

        return this.toxicBetUserApiService.registerUser({
          name: userName,
          email,
        }).pipe(mapTo(void 0));
      }),
    );
  }
}
