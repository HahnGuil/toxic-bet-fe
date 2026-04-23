import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { AuthApiService } from './auth-api.service';
import { AuthSessionService } from './auth-session.service';
import {
  ErrorResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  SuccessResponse,
  ValidateCodeResponse,
} from './auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authApiService = inject(AuthApiService);
  private readonly authSessionService = inject(AuthSessionService);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.authApiService.login(request).pipe(
      tap((response) => {
        this.authSessionService.startSession(response);
      }),
    );
  }

  loginWithGoogle(): void {
    this.authApiService.startGoogleLogin();
  }

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.authApiService.register(request).pipe(
      tap((response) => {
        this.authSessionService.startSession(response);
      }),
    );
  }

  requestPasswordReset(email: string): Observable<SuccessResponse> {
    return this.authApiService.requestPasswordReset({ email });
  }

  validateResetCode(email: string, recoveryCode: string): Observable<ValidateCodeResponse> {
    return this.authApiService.validateResetCode({ email, recoveryCode });
  }

  resetPassword(newPassword: string, recoverToken: string): Observable<void> {
    return this.authApiService.resetPassword({ newPassword }, recoverToken);
  }

  toUserErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Nao foi possivel concluir o login. Tente novamente.';
    }

    if (error.status === 0) {
      return 'Nao foi possivel conectar ao servidor de autenticacao.';
    }

    const errorBody = error.error as ErrorResponse | null;

    if (errorBody?.message) {
      return errorBody.message;
    }

    if (error.status === 401) {
      return 'E-mail ou senha invalidos.';
    }

    return 'Falha ao autenticar no servidor. Tente novamente.';
  }

  toUserRegisterErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Nao foi possivel concluir o cadastro. Tente novamente.';
    }

    if (error.status === 0) {
      return 'Nao foi possivel conectar ao servidor de autenticacao.';
    }

    const errorBody = error.error as ErrorResponse | null;

    if (errorBody?.message) {
      return errorBody.message;
    }

    if (error.status === 409) {
      return 'Este e-mail ja esta cadastrado.';
    }

    if (error.status === 400 || error.status === 422) {
      return 'Revise os dados informados para concluir o cadastro.';
    }

    return 'Falha ao cadastrar no servidor. Tente novamente.';
  }

  toUserPasswordRecoveryErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Nao foi possivel concluir esta etapa. Tente novamente.';
    }

    if (error.status === 0) {
      return 'Nao foi possivel conectar ao servidor de autenticacao.';
    }

    const errorBody = error.error as ErrorResponse | null;

    if (errorBody?.message) {
      return errorBody.message;
    }

    if (error.status === 404) {
      return 'Nao existe usuario cadastrado com este e-mail.';
    }

    if (error.status === 401) {
      return 'Codigo invalido ou expirado. Solicite um novo codigo.';
    }

    return 'Falha na recuperacao de senha. Tente novamente.';
  }
}
