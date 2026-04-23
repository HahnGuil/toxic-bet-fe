import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-cadastro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cadastro {
  private readonly authService = inject(AuthService);

  protected readonly isSubmitting = signal(false);
  protected readonly submitAttempted = signal(false);
  protected readonly activeTypingField = signal<'username' | 'firstName' | 'lastName' | 'email' | 'password' | null>(null);
  protected readonly backendErrorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly cadastroForm = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(12),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,12}$/),
      ],
    }),
  });

  protected showFieldError(field: 'username' | 'firstName' | 'lastName' | 'email' | 'password'): boolean {
    const control = this.cadastroForm.controls[field];

    return (
      control.invalid
      && (control.touched || this.submitAttempted())
      && this.activeTypingField() !== field
    );
  }

  protected startTyping(field: 'username' | 'firstName' | 'lastName' | 'email' | 'password'): void {
    this.activeTypingField.set(field);
    this.backendErrorMessage.set(null);
    this.successMessage.set(null);
  }

  protected stopTyping(field: 'username' | 'firstName' | 'lastName' | 'email' | 'password'): void {
    this.activeTypingField.set(null);
    this.cadastroForm.controls[field].markAsTouched();
  }

  protected submit(): void {
    this.submitAttempted.set(true);

    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
      return;
    }

    const { username, firstName, lastName, email, password } = this.cadastroForm.getRawValue();

    this.isSubmitting.set(true);
    this.backendErrorMessage.set(null);
    this.successMessage.set(null);

    this.authService
      .register({
        username,
        firstName,
        lastName,
        email,
        password,
        pictureUrl: null,
        typeUser: 'DIRECT_USER',
        applicationCode: 1,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.cadastroForm.reset();
          this.submitAttempted.set(false);
          this.successMessage.set('Cadastro realizado com sucesso. Agora voce pode fazer login.');
        },
        error: (error: unknown) => {
          this.backendErrorMessage.set(this.authService.toUserRegisterErrorMessage(error));
        },
      });
  }
}
