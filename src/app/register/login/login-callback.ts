import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-callback',
  templateUrl: './login-callback.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;

    // Fluxo de redirect com ?data=JSON (backend envia JSON encodado)
    if (params['data']) {
      try {
        const json = JSON.parse(params['data'] as string);
        const finalUserName = json.userName || json.name;
        if (finalUserName && json.email && json.token && json.refreshToken) {
          this.processGoogleLogin({ userName: finalUserName, email: json.email, token: json.token, refreshToken: json.refreshToken });
          return;
        }
      } catch {
        // JSON inválido, tenta query params diretos abaixo
      }
    }

    // Fluxo com query params diretos
    const { userName, name, email, token, refreshToken } = params;
    const finalUserName = userName || name;
    if (finalUserName && email && token && refreshToken) {
      this.processGoogleLogin({ userName: finalUserName, email, token, refreshToken });
      return;
    }

    // Nenhum dado encontrado — volta para login
    this.router.navigate(['/register/login']);
  }

  private processGoogleLogin(response: { userName: string, email: string, token: string, refreshToken: string }): void {
    this.authService.handleGoogleLoginCallback(response);
    this.router.navigate(['/match']);
  }
}
