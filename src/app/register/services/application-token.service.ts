import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { timer, BehaviorSubject, Subscription } from 'rxjs';

interface ApplicationTokenResponse {
  applicationToken: string;
  refreshApplicationToken: string;
  expiresIn: number; // seconds
}

@Injectable({ providedIn: 'root' })
export class ApplicationTokenService {
  public readonly applicationToken$ = new BehaviorSubject<string | null>(null);
  private refreshApplicationToken$ = new BehaviorSubject<string | null>(null);
  private tokenExpiry: number | null = null;
  private refreshSub: Subscription | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Call this on app startup
   */
  public initialize(): void {
    this.log('Initializing application token flow');
    this.fetchApplicationToken();
  }

  public getApplicationToken(): string | null {
    return this.applicationToken$.value;
  }

  public getRefreshApplicationToken(): string | null {
    return this.refreshApplicationToken$.value;
  }

  private fetchApplicationToken(): void {
    const url = `${environment.apiBaseUrl}${environment.authServerContextPath}/application`;
    const headers = new HttpHeaders({
      publicId: environment.applicationPublicId,
    });
    this.log('Requesting application token');
    this.http.post<ApplicationTokenResponse>(url, {}, { headers }).subscribe({
      next: (res) => {
        this.setTokens(res.applicationToken, res.refreshApplicationToken, res.expiresIn);
        this.log('Application token acquired');
      },
      error: (err) => {
        this.log('Failed to fetch application token', err);
      },
    });
  }

  private setTokens(token: string, refreshToken: string, expiresIn: number): void {
    this.applicationToken$.next(token);
    this.refreshApplicationToken$.next(refreshToken);
    // expiresIn is in seconds
    const now = Date.now();
    this.tokenExpiry = now + expiresIn * 1000;
    this.scheduleRefresh();
  }

  private scheduleRefresh(): void {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
    if (!this.tokenExpiry) return;
    // Refresh 5 minutes before expiry
    const now = Date.now();
    const msToRefresh = this.tokenExpiry - now - 5 * 60 * 1000;
    if (msToRefresh <= 0) {
      this.refreshApplicationToken();
      return;
    }
    this.log(`Scheduling token refresh in ${msToRefresh / 1000}s`);
    this.refreshSub = timer(msToRefresh).subscribe(() => this.refreshApplicationToken());
  }

  private refreshApplicationToken(): void {
    const url = `${environment.apiBaseUrl}${environment.authServerContextPath}/token/application`;
    const refreshToken = this.refreshApplicationToken$.value;
    if (!refreshToken) {
      this.log('No refresh token, fetching new application token');
      this.fetchApplicationToken();
      return;
    }
    const headers = new HttpHeaders({
      publicId: environment.applicationPublicId,
      Authorization: `Bearer ${refreshToken}`,
    });
    this.log('Refreshing application token');
    this.http.post<ApplicationTokenResponse>(url, {}, { headers }).subscribe({
      next: (res) => {
        this.setTokens(res.applicationToken, res.refreshApplicationToken, res.expiresIn);
        this.log('Application token refreshed');
      },
      error: (err) => {
        if (err.status === 401) {
          this.log('Refresh token expired, fetching new application token');
          this.fetchApplicationToken();
        } else {
          this.log('Failed to refresh application token', err);
        }
      },
    });
  }

  private log(message: string, error?: any): void {
    // Only log to Node.js/server console, not browser
    if (typeof window === 'undefined' || (window && !window.console)) {
      // Node.js or SSR
      // eslint-disable-next-line no-console
      console.log(`[${this.getBrasiliaTime()}] [ApplicationTokenService] ${message}`);
      if (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    }
  }

  private getBrasiliaTime(): string {
    const date = new Date();
    // Brasília is UTC-3
    return date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  }
}
