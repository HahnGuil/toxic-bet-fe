import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  NewPasswordRequest,
  PasswordResetRequest,
  RegisterRequest,
  RegisterResponse,
  SuccessResponse,
  ValidateCodeRequest,
  ValidateCodeResponse,
} from './auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly authServerBaseUrl = `${environment.apiBaseUrl}${environment.authServerContextPath}`;

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authServerBaseUrl}/login`, request);
  }

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.authServerBaseUrl}/users`, request);
  }

  requestPasswordReset(request: PasswordResetRequest): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(`${this.authServerBaseUrl}/password/reset-request`, request);
  }

  validateResetCode(request: ValidateCodeRequest): Observable<ValidateCodeResponse> {
    return this.http.post<ValidateCodeResponse>(`${this.authServerBaseUrl}/password/validate-code`, request);
  }

  resetPassword(request: NewPasswordRequest, recoverToken: string): Observable<void> {
    return this.http.patch<void>(
      `${this.authServerBaseUrl}/password/reset-password`,
      request,
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${recoverToken}`,
        }),
      },
    );
  }

  refreshToken(refreshToken: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.authServerBaseUrl}/token`,
      null,
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${refreshToken}`,
        }),
      },
    );
  }

  startGoogleLogin(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.location.assign(`${this.authServerBaseUrl}/oauth2/authorization/google`);
  }
}
