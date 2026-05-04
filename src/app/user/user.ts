import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AppFooter } from '../shared/footer/footer';
import { AppHeader } from '../shared/header/header';
import { AuthService } from '../register/services/auth.service';
import { AuthSessionService } from '../register/services/auth-session.service';
import { UserApiService, UserProfileResponse } from './user-api.service';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [AppHeader, AppFooter, FormsModule],
  templateUrl: './user.html',
  styleUrl: './user.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class User implements OnInit {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly authService = inject(AuthService);
  private readonly userApi = inject(UserApiService);
  private readonly router = inject(Router);

  protected readonly isPageTransitioning = signal(false);
  protected readonly isLoggingOut = signal(false);
  protected readonly profile = signal<UserProfileResponse | null>(null);
  protected readonly loadError = signal(false);

  // Popup state
  protected readonly editPopupOpen = signal(false);
  protected editUserNameValue = '';
  protected readonly isSaving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  protected get userInitials(): string {
    const name = this.profile()?.fullName ?? this.authSessionService.getSessionUserName() ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  }

  ngOnInit(): void {
    this.userApi.getProfile().subscribe((data) => {
      if (data === null) {
        this.loadError.set(true);
      } else {
        this.profile.set(data);
      }
    });
  }

  protected openEditPopup(): void {
    this.editUserNameValue = this.profile()?.userName ?? '';
    this.saveError.set(null);
    this.editPopupOpen.set(true);
  }

  protected closeEditPopup(): void {
    if (this.isSaving()) return;
    this.editPopupOpen.set(false);
  }

  protected saveUserName(): void {
    const trimmed = this.editUserNameValue.trim();
    if (!trimmed || this.isSaving()) return;

    this.isSaving.set(true);
    this.saveError.set(null);

    this.userApi.patchUsername(trimmed).subscribe((error) => {
      this.isSaving.set(false);
      if (error === null) {
        const current = this.profile();
        if (current) {
          this.profile.set({ ...current, userName: trimmed });
        }
        this.editPopupOpen.set(false);
      } else if (error === 'conflict') {
        this.saveError.set('Este user name já está em uso. Escolha outro.');
      } else if (error === 'invalid') {
        this.saveError.set('Formato de user name inválido.');
      } else {
        this.saveError.set('Erro ao salvar. Tente novamente.');
      }
    });
  }

  protected logout(): void {
    if (this.isLoggingOut()) return;

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
