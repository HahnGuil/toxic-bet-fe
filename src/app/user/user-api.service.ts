import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { AuthSessionService } from '../register/services/auth-session.service';

export interface UserProfileResponse {
  userName: string;
  fullName: string;
  email: string;
}

export type PatchUsernameError = 'conflict' | 'invalid' | 'unknown';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}${environment.authServerContextPath}`;
  private readonly http = inject(HttpClient);
  private readonly authSession = inject(AuthSessionService);

  getProfile(): Observable<UserProfileResponse | null> {
    const token = this.authSession.getAccessToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token ?? ''}` });
    return this.http
      .get<UserProfileResponse>(`${this.baseUrl}/users/me`, { headers })
      .pipe(catchError(() => of(null)));
  }

  patchUsername(newUserName: string): Observable<PatchUsernameError | null> {
    const token = this.authSession.getAccessToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`,
      'Content-Type': 'application/json',
    });
    return new Observable((observer) => {
      this.http
        .patch<void>(`${this.baseUrl}/users/username`, { userName: newUserName }, { headers })
        .subscribe({
          next: () => { observer.next(null); observer.complete(); },
          error: (err) => {
            let kind: PatchUsernameError = 'unknown';
            if (err?.status === 409) kind = 'conflict';
            else if (err?.status === 422) kind = 'invalid';
            observer.next(kind);
            observer.complete();
          },
        });
    });
  }
}
