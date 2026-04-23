import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AuthApiService } from './auth-api.service';
import { LoginResponse } from './auth.models';

interface AuthSession {
  userName: string;
  email: string;
  token: string;
  refreshToken: string;
  expiresAt: number;
  lastActivityAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private static readonly STORAGE_KEY = 'auth_session';
  private static readonly TOKEN_FALLBACK_DURATION_MS = 30 * 60 * 1000;
  private static readonly REFRESH_WINDOW_MS = 5 * 60 * 1000;

  private readonly authApiService = inject(AuthApiService);

  private readonly sessionState = signal<AuthSession | null>(null);

  private refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private expirationTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private listenersRegistered = false;
  private isRefreshing = false;

  private readonly onUserActivity = (): void => {
    const session = this.sessionState();
    if (!session) {
      return;
    }

    const now = Date.now();
    if (now - session.lastActivityAt < 1000) {
      return;
    }

    const updated = {
      ...session,
      lastActivityAt: now,
    };

    this.sessionState.set(updated);
    this.persistSession(updated);
  };

  initializeFromStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const rawSession = localStorage.getItem(AuthSessionService.STORAGE_KEY);
    if (!rawSession) {
      return;
    }

    try {
      const parsed = JSON.parse(rawSession) as Partial<AuthSession>;
      if (!parsed.token || !parsed.refreshToken || !parsed.email) {
        this.clearSession();
        return;
      }

      const expiresAt = Number(parsed.expiresAt);
      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        this.clearSession();
        return;
      }

      const restored: AuthSession = {
        userName: parsed.userName ?? '',
        email: parsed.email,
        token: parsed.token,
        refreshToken: parsed.refreshToken,
        expiresAt,
        lastActivityAt: Number(parsed.lastActivityAt) || Date.now(),
      };

      this.sessionState.set(restored);
      this.registerActivityListeners();
      this.scheduleSessionTimers();
    } catch {
      this.clearSession();
    }
  }

  startSession(response: LoginResponse): void {
    const now = Date.now();
    const expiresAt = this.extractExpirationFromJwt(response.token)
      ?? (now + AuthSessionService.TOKEN_FALLBACK_DURATION_MS);

    const session: AuthSession = {
      userName: response.userName,
      email: response.email,
      token: response.token,
      refreshToken: response.refreshToken,
      expiresAt,
      lastActivityAt: now,
    };

    this.sessionState.set(session);
    this.persistSession(session);
    this.registerActivityListeners();
    this.scheduleSessionTimers();
  }

  clearSession(): void {
    this.sessionState.set(null);

    if (typeof window !== 'undefined') {
      localStorage.removeItem(AuthSessionService.STORAGE_KEY);
    }

    this.clearTimers();
  }

  getAccessToken(): string | null {
    return this.sessionState()?.token ?? null;
  }

  private refreshSessionTokenIfNeeded(): void {
    const session = this.sessionState();
    if (!session || this.isRefreshing) {
      return;
    }

    const now = Date.now();
    const userWasActiveRecently = now - session.lastActivityAt <= AuthSessionService.REFRESH_WINDOW_MS;
    if (!userWasActiveRecently) {
      return;
    }

    this.isRefreshing = true;

    this.authApiService
      .refreshToken(session.refreshToken)
      .pipe(finalize(() => {
        this.isRefreshing = false;
      }))
      .subscribe({
        next: (response) => {
          this.startSession(response);
        },
        error: () => {
          this.clearSession();
        },
      });
  }

  private scheduleSessionTimers(): void {
    this.clearTimers();

    const session = this.sessionState();
    if (!session) {
      return;
    }

    const now = Date.now();
    const refreshAt = session.expiresAt - AuthSessionService.REFRESH_WINDOW_MS;

    if (refreshAt <= now) {
      this.refreshSessionTokenIfNeeded();
    } else {
      this.refreshTimeoutId = setTimeout(() => {
        this.refreshSessionTokenIfNeeded();
      }, refreshAt - now);
    }

    this.expirationTimeoutId = setTimeout(() => {
      const activeSession = this.sessionState();
      if (!activeSession || activeSession.expiresAt > Date.now()) {
        return;
      }

      this.clearSession();
    }, Math.max(session.expiresAt - now, 0));
  }

  private clearTimers(): void {
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }

    if (this.expirationTimeoutId) {
      clearTimeout(this.expirationTimeoutId);
      this.expirationTimeoutId = null;
    }
  }

  private registerActivityListeners(): void {
    if (this.listenersRegistered || typeof window === 'undefined') {
      return;
    }

    const events = ['pointerdown', 'keydown', 'mousemove', 'touchstart', 'scroll'];
    for (const eventName of events) {
      window.addEventListener(eventName, this.onUserActivity, { passive: true });
    }

    this.listenersRegistered = true;
  }

  private persistSession(session: AuthSession): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(AuthSessionService.STORAGE_KEY, JSON.stringify(session));
  }

  private extractExpirationFromJwt(token: string): number | null {
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) {
        return null;
      }

      const normalized = payloadPart
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const padded = normalized.padEnd(normalized.length + (4 - (normalized.length % 4 || 4)) % 4, '=');
      const decodedPayload = atob(padded);
      const payload = JSON.parse(decodedPayload) as { exp?: number };

      if (typeof payload.exp !== 'number') {
        return null;
      }

      return payload.exp * 1000;
    } catch {
      return null;
    }
  }
}
