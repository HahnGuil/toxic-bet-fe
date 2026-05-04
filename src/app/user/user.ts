import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { AppFooter } from '../shared/footer/footer';
import { AppHeader } from '../shared/header/header';
import { AuthService } from '../register/services/auth.service';
import { AuthSessionService } from '../register/services/auth-session.service';
import { ChangePasswordError, UserApiService, UserProfileResponse } from './user-api.service';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,12}$/;

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [AppHeader, AppFooter, FormsModule, RouterLink],
  templateUrl: './user.html',
  styleUrl: './user.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class User implements OnInit, OnDestroy {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly authService = inject(AuthService);
  private readonly userApi = inject(UserApiService);
  private readonly router = inject(Router);

  protected readonly isPageTransitioning = signal(false);
  protected readonly isLoggingOut = signal(false);
  protected readonly isAdmin = signal(false);
  protected readonly profile = signal<UserProfileResponse | null>(null);
  protected readonly loadError = signal(false);

  // Edit username popup
  protected readonly editPopupOpen = signal(false);
  protected editUserNameValue = '';
  protected readonly isSaving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  // Change password popup
  protected readonly changePwOpen = signal(false);
  protected readonly showOldPw = signal(false);
  protected readonly showNewPw = signal(false);
  protected readonly showPwHint = signal(false);
  protected changePwOld = '';
  protected changePwNew = '';
  protected readonly isChangingPw = signal(false);
  protected readonly changePwSubmitAttempted = signal(false);
  protected readonly changePwError = signal<string | null>(null);
  protected readonly changePwSuccess = signal(false);

  private changePwSub: Subscription | null = null;
  private logoutTimer: ReturnType<typeof setTimeout> | null = null;
  private pwHintTimer: ReturnType<typeof setTimeout> | null = null;

  protected get userInitials(): string {
    const name = this.profile()?.fullName ?? this.authSessionService.getSessionUserName() ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  }

  protected get changePwOldInvalid(): boolean {
    return this.changePwSubmitAttempted() && !this.changePwOld.trim();
  }

  protected get changePwNewInvalid(): boolean {
    return this.changePwSubmitAttempted() && !PASSWORD_PATTERN.test(this.changePwNew);
  }

  ngOnInit(): void {
    this.authSessionService.initializeFromStorage();
    this.isAdmin.set(this.authSessionService.isAdmin());

    this.userApi.getProfile().subscribe((data) => {
      if (data === null) {
        this.loadError.set(true);
      } else {
        this.profile.set(data);
      }
    });
  }

  ngOnDestroy(): void {
    this.changePwSub?.unsubscribe();
    if (this.logoutTimer !== null) clearTimeout(this.logoutTimer);
    if (this.pwHintTimer !== null) clearTimeout(this.pwHintTimer);
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

  // ── Change password ──────────────────────────────────────────────────────
  protected onNewPwInput(): void {
    this.showPwHint.set(true);
    if (this.pwHintTimer !== null) clearTimeout(this.pwHintTimer);
    this.pwHintTimer = setTimeout(() => this.showPwHint.set(false), 2000);
  }

  protected openChangePwPopup(): void {
    this.changePwOld = '';
    this.changePwNew = '';
    this.changePwSubmitAttempted.set(false);
    this.changePwError.set(null);
    this.changePwSuccess.set(false);
    this.showPwHint.set(false);
    this.changePwOpen.set(true);
  }

  protected closeChangePwPopup(): void {
    if (this.isChangingPw()) return;
    this.changePwOpen.set(false);
  }

  protected submitChangePassword(): void {
    this.changePwSubmitAttempted.set(true);
    const email = this.profile()?.email;

    if (!email || !this.changePwOld.trim() || !PASSWORD_PATTERN.test(this.changePwNew)) {
      return;
    }

    this.isChangingPw.set(true);
    this.changePwError.set(null);

    this.changePwSub = this.userApi.changePassword(email, this.changePwOld, this.changePwNew).subscribe((error) => {
      this.isChangingPw.set(false);

      if (error === null) {
        this.changePwSuccess.set(true);
        this.logoutTimer = setTimeout(() => this.logout(), 3000);
        return;
      }

      const messages: Record<ChangePasswordError, string> = {
        'wrong-password': 'Senha atual incorreta.',
        'gmail-user': 'Não é possível alterar a senha de contas cadastradas via Google.',
        'invalid-password': 'A nova senha deve ter 8 a 12 caracteres com maiúscula, minúscula, número e símbolo.',
        'not-found': 'Usuário não encontrado.',
        'unknown': 'Erro ao alterar a senha. Tente novamente.',
      };
      this.changePwError.set(messages[error]);
    });
  }

  // ────────────────────────────────────────────────────────────────────────
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
