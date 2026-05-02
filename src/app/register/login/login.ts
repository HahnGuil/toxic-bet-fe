// ...existing code...
// ...existing code...
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
    protected loginWithGoogle(): void {
      this.authService.loginWithGoogle();
    }
  protected readonly resetCodeFields = ['digit1', 'digit2', 'digit3', 'digit4', 'digit5', 'digit6'] as const;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly isPageTransitioning = signal(false);
  protected readonly submitAttempted = signal(false);
  protected readonly activeTypingField = signal<'email' | 'password' | null>(null);
  protected readonly backendErrorMessage = signal<string | null>(null);
  protected readonly isResetModalOpen = signal(false);
  protected readonly resetStep = signal<'request' | 'code' | 'new-password' | 'success'>('request');
  protected readonly isResetSubmitting = signal(false);
  protected readonly resetSubmitAttempted = signal(false);
  protected readonly resetEmail = signal<string>('');
  protected readonly recoverToken = signal<string>('');
  protected readonly resetErrorMessage = signal<string | null>(null);
  protected readonly resetInfoMessage = signal<string | null>(null);
  protected readonly activeResetTypingField = signal<string | null>(null);

  protected readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), Validators.maxLength(12)],
    }),
  });

  protected readonly resetRequestForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  protected readonly resetCodeForm = new FormGroup({
    digit1: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d$/)] }),
    digit2: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d$/)] }),
    digit3: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d$/)] }),
    digit4: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d$/)] }),
    digit5: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d$/)] }),
    digit6: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d$/)] }),
  });

  protected readonly resetPasswordForm = new FormGroup({
    newPassword: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(12),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,12}$/),
      ],
    }),
  });

  protected showFieldError(field: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[field];

    return (
      control.invalid
      && (control.touched || this.submitAttempted())
      && this.activeTypingField() !== field
    );
  }

  protected startTyping(field: 'email' | 'password'): void {
    this.activeTypingField.set(field);
    this.backendErrorMessage.set(null);
  }

  protected stopTyping(field: 'email' | 'password'): void {
    this.activeTypingField.set(null);
    this.loginForm.controls[field].markAsTouched();
  }

  protected submit(): void {
    this.submitAttempted.set(true);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.backendErrorMessage.set(null);

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: async () => {
          this.loginForm.reset();
          this.submitAttempted.set(false);
          this.isPageTransitioning.set(true);
          setTimeout(async () => {
            await this.router.navigate(['/match']);
          }, 220);
        },
        error: (error: unknown) => {
          this.backendErrorMessage.set(this.authService.toUserErrorMessage(error));
        },
      });
  }


  protected openResetModal(): void {
    this.resetAllRecoveryState();
    this.isResetModalOpen.set(true);
  }

  protected closeResetModal(): void {
    this.isResetModalOpen.set(false);
    this.resetAllRecoveryState();
  }

  protected showResetRequestEmailError(): boolean {
    const control = this.resetRequestForm.controls.email;

    return (
      control.invalid
      && (control.touched || this.resetSubmitAttempted())
      && this.activeResetTypingField() !== 'reset-email'
    );
  }

  protected showResetCodeFieldError(field: typeof this.resetCodeFields[number]): boolean {
    const control = this.resetCodeForm.controls[field];

    return (
      control.invalid
      && (control.touched || this.resetSubmitAttempted())
      && this.activeResetTypingField() !== field
    );
  }

  protected showResetNewPasswordError(): boolean {
    const control = this.resetPasswordForm.controls.newPassword;

    return (
      control.invalid
      && (control.touched || this.resetSubmitAttempted())
      && this.activeResetTypingField() !== 'new-password'
    );
  }

  protected startResetTyping(field: string): void {
    this.activeResetTypingField.set(field);
    this.resetErrorMessage.set(null);
  }

  protected stopResetRequestEmailTyping(): void {
    this.activeResetTypingField.set(null);
    this.resetRequestForm.controls.email.markAsTouched();
  }

  protected stopResetCodeTyping(field: typeof this.resetCodeFields[number]): void {
    this.activeResetTypingField.set(null);
    this.resetCodeForm.controls[field].markAsTouched();
  }

  protected stopResetNewPasswordTyping(): void {
    this.activeResetTypingField.set(null);
    this.resetPasswordForm.controls.newPassword.markAsTouched();
  }

  protected onResetCodeInput(
    field: typeof this.resetCodeFields[number],
    event: Event,
    index: number,
  ): void {
    const input = event.target as HTMLInputElement;
    const normalized = input.value.replace(/\D/g, '').slice(0, 1);
    this.resetCodeForm.controls[field].setValue(normalized);
    this.startResetTyping(field);

    if (!normalized || typeof document === 'undefined' || index >= this.resetCodeFields.length - 1) {
      return;
    }

    const nextInput = document.getElementById(`reset-code-${index + 1}`) as HTMLInputElement | null;
    nextInput?.focus();
  }

  protected onResetCodeKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key !== 'Backspace' || typeof document === 'undefined' || index <= 0) {
      return;
    }

    const currentField = this.resetCodeFields[index];
    const currentValue = this.resetCodeForm.controls[currentField].value;

    if (currentValue) {
      return;
    }

    const previousInput = document.getElementById(`reset-code-${index - 1}`) as HTMLInputElement | null;
    previousInput?.focus();
  }

  protected sendRecoveryCode(): void {
    this.resetSubmitAttempted.set(true);

    if (this.resetRequestForm.invalid) {
      this.resetRequestForm.markAllAsTouched();
      return;
    }

    const email = this.resetRequestForm.controls.email.getRawValue();

    this.isResetSubmitting.set(true);
    this.resetErrorMessage.set(null);
    this.resetInfoMessage.set(null);

    this.authService
      .requestPasswordReset(email)
      .pipe(finalize(() => this.isResetSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.resetEmail.set(email);
          this.resetStep.set('code');
          this.resetSubmitAttempted.set(false);
          this.resetInfoMessage.set(response.message || 'Codigo enviado para seu e-mail.');
        },
        error: (error: unknown) => {
          this.resetErrorMessage.set(this.authService.toUserPasswordRecoveryErrorMessage(error));
        },
      });
  }

  protected validateRecoveryCode(): void {
    this.resetSubmitAttempted.set(true);

    if (this.resetCodeForm.invalid) {
      this.resetCodeForm.markAllAsTouched();
      return;
    }

    const recoveryCode = this.resetCodeFields
      .map((field) => this.resetCodeForm.controls[field].getRawValue())
      .join('');

    this.isResetSubmitting.set(true);
    this.resetErrorMessage.set(null);
    this.resetInfoMessage.set(null);

    this.authService
      .validateResetCode(this.resetEmail(), recoveryCode)
      .pipe(finalize(() => this.isResetSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.recoverToken.set(response.recoverToken);
          this.resetStep.set('new-password');
          this.resetSubmitAttempted.set(false);
        },
        error: (error: unknown) => {
          this.resetErrorMessage.set(this.authService.toUserPasswordRecoveryErrorMessage(error));
        },
      });
  }

  protected updatePassword(): void {
    this.resetSubmitAttempted.set(true);

    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    const token = this.recoverToken();
    if (!token) {
      this.resetErrorMessage.set('Nao foi possivel validar o token de recuperacao. Tente novamente.');
      return;
    }

    const newPassword = this.resetPasswordForm.controls.newPassword.getRawValue();

    this.isResetSubmitting.set(true);
    this.resetErrorMessage.set(null);
    this.resetInfoMessage.set(null);

    this.authService
      .resetPassword(newPassword, token)
      .pipe(finalize(() => this.isResetSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.resetStep.set('success');
          this.resetSubmitAttempted.set(false);
          this.resetInfoMessage.set('Senha atualizada com sucesso.');
        },
        error: (error: unknown) => {
          this.resetErrorMessage.set(this.authService.toUserPasswordRecoveryErrorMessage(error));
        },
      });
  }

  private resetAllRecoveryState(): void {
    this.resetStep.set('request');
    this.isResetSubmitting.set(false);
    this.resetSubmitAttempted.set(false);
    this.resetEmail.set('');
    this.recoverToken.set('');
    this.resetErrorMessage.set(null);
    this.resetInfoMessage.set(null);
    this.activeResetTypingField.set(null);
    this.resetRequestForm.reset();
    this.resetCodeForm.reset();
    this.resetPasswordForm.reset();
  }
}
