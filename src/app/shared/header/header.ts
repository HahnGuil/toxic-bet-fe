import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../register/services/auth.service';
import { AuthSessionService } from '../../register/services/auth-session.service';
import { PushNotificationService } from '../../notifications/push-notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeader {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authSessionService = inject(AuthSessionService);
  protected readonly pushNotifications = inject(PushNotificationService);

  readonly startFadeOut = output<void>();

  protected readonly isLoggingOut = signal(false);

  constructor() {
    this.pushNotifications.initialize();
  }

  protected toggleNotifications(): void {
    const action = this.pushNotifications.isSubscribed()
      ? this.pushNotifications.disable()
      : this.pushNotifications.enable();

    action.subscribe();
  }

  protected logoff(): void {
    if (this.isLoggingOut()) {
      return;
    }

    const email = this.authSessionService.getSessionEmail();
    if (!email) {
      this.authSessionService.clearSession();
      this.router.navigate(['/register/login']);
      return;
    }

    this.isLoggingOut.set(true);

    this.authService.logout(email).subscribe({
      next: async () => {
        this.pushNotifications.disable().subscribe();
        this.authSessionService.clearSession();
        this.startFadeOut.emit();
        setTimeout(async () => {
          await this.router.navigate(['/register/login']);
        }, 220);
      },
      error: () => {
        this.isLoggingOut.set(false);
      },
    });
  }
}
