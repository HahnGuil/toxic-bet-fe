import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';

import { environment } from '../../environments/environment';

interface BrowserPushSubscription {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
}

interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly http = inject(HttpClient);
  private readonly swPush = inject(SwPush);
  private readonly baseUrl = `${environment.toxicBetApiBaseUrl}/notifications`;
  private initialized = false;

  readonly isSubscribed = signal(false);
  readonly isBusy = signal(false);
  readonly isSupported = signal(this.swPush.isEnabled);

  initialize(): void {
    if (this.initialized || !this.swPush.isEnabled) {
      return;
    }

    this.initialized = true;
    this.swPush.subscription.subscribe((subscription) => {
      this.isSubscribed.set(!!subscription);
    });
  }

  enable(): Observable<boolean> {
    if (!this.swPush.isEnabled || this.isBusy()) {
      return of(false);
    }

    this.isBusy.set(true);
    return this.getPublicKey().pipe(
      switchMap((publicKey) => this.requestSubscription(publicKey)),
      switchMap((subscription) => this.saveSubscription(subscription)),
      map(() => true),
      tap(() => this.isSubscribed.set(true)),
      catchError(() => of(false)),
      tap(() => this.isBusy.set(false)),
    );
  }

  disable(): Observable<boolean> {
    if (!this.swPush.isEnabled || this.isBusy()) {
      return of(false);
    }

    this.isBusy.set(true);
    return this.swPush.subscription.pipe(
      switchMap((subscription) => {
        if (!subscription) {
          this.isSubscribed.set(false);
          return of(true);
        }

        const endpoint = subscription.endpoint;
        return this.http.delete<void>(`${this.baseUrl}/subscriptions`, {
          body: { endpoint },
        }).pipe(
          switchMap(() => subscription.unsubscribe()),
          tap(() => this.isSubscribed.set(false)),
          map(() => true),
        );
      }),
      catchError(() => of(false)),
      tap(() => this.isBusy.set(false)),
    );
  }

  private getPublicKey(): Observable<string> {
    return this.http.get(`${this.baseUrl}/public-key`, { responseType: 'text' });
  }

  private requestSubscription(serverPublicKey: string): Observable<PushSubscriptionPayload> {
    return new Observable((observer) => {
      this.swPush.requestSubscription({ serverPublicKey })
        .then((subscription) => {
          observer.next(this.toPayload(subscription));
          observer.complete();
        })
        .catch((error: unknown) => observer.error(error));
    });
  }

  private saveSubscription(subscription: PushSubscriptionPayload): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/subscriptions`, subscription);
  }

  private toPayload(subscription: PushSubscription): PushSubscriptionPayload {
    const json = subscription.toJSON() as BrowserPushSubscription;
    const endpoint = json.endpoint ?? subscription.endpoint;
    const p256dh = json.keys?.p256dh;
    const auth = json.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      throw new Error('Invalid push subscription.');
    }

    return {
      endpoint,
      keys: {
        p256dh,
        auth,
      },
    };
  }
}
