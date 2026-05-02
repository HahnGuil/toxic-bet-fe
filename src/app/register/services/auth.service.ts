// ...existing code...

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, tap } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthSessionService } from './auth-session.service';
import { ToxicBetUserService } from './toxic-bet-user.service';
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
    /**
     * Trata o retorno do login com Google: inicia sessão, verifica usuário e registra se necessário.
     * @param response { userName, email, token, refreshToken }
     */
    handleGoogleLoginCallback(response: LoginResponse): void {
      this.authSessionService.startSession(response);
      // Verifica/registra o usuário em background — navegação é responsabilidade do chamador
      this.toxicBetUserService.existsByEmailWithToken(response.email, response.token).subscribe({
        next: (exists) => {
          if (!exists) {
            this.toxicBetUserService.registerUserWithToken(response.userName, response.email, response.token).subscribe({
              error: (err) => console.error('[GoogleLogin] User registration failed', err),
            });
          }
        },
        error: (err) => console.error('[GoogleLogin] existsByEmail failed', err),
      });
    }
  private readonly authApiService = inject(AuthApiService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly toxicBetUserService = inject(ToxicBetUserService);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.authApiService.login(request).pipe(
      tap((response) => {
        this.authSessionService.startSession(response);
      }),
      switchMap((response) => this.toxicBetUserService.ensureRegistered(response.userName, response.email).pipe(
        map(() => response),
      )),
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
      switchMap((response) => this.toxicBetUserService.ensureRegistered(response.userName, response.email).pipe(
        map(() => response),
      )),
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

  logout(email: string): Observable<void> {
    return this.authApiService.logout({ email });
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

    return 'Falha ao autenticar ou sincronizar seu acesso no Toxic Bet. Tente novamente.';
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

    return 'Falha ao cadastrar ou sincronizar seu acesso no Toxic Bet. Tente novamente.';
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
