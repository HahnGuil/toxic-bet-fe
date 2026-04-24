import { Injectable, inject } from '@angular/core';
import { Observable, mapTo, of, switchMap } from 'rxjs';

import { ToxicBetUserApiService } from './toxic-bet-user-api.service';

@Injectable({
  providedIn: 'root',
})
export class ToxicBetUserService {
  private readonly toxicBetUserApiService = inject(ToxicBetUserApiService);

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
