import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../register/services/auth.service';
import { AuthSessionService } from '../register/services/auth-session.service';

@Component({
  selector: 'app-match',
  templateUrl: './match.html',
  styleUrl: './match.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Match {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authSessionService = inject(AuthSessionService);

  protected readonly isLoggingOut = signal(false);
  protected readonly isPageTransitioning = signal(false);

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
        this.authSessionService.clearSession();
        this.isPageTransitioning.set(true);

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
