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
    this.route.queryParams.subscribe(params => {
      // Fallback: fluxo de redirect com ?data=...
      if (params['data']) {
        try {
          const json = JSON.parse(decodeURIComponent(params['data']));
          const finalUserName = json.userName || json.name;
          if (finalUserName && json.email && json.token && json.refreshToken) {
            this.processGoogleLogin({ userName: finalUserName, email: json.email, token: json.token, refreshToken: json.refreshToken });
            return;
          }
        } catch (e) {
          // erro de parse, ignora
        }
      }
      // Fluxo padrão: query params diretos
      const { userName, email, token, refreshToken, name } = params;
      const finalUserName = userName || name;
      if (finalUserName && email && token && refreshToken) {
        this.processGoogleLogin({ userName: finalUserName, email, token, refreshToken });
        return;
      }
      // Se não conseguiu processar, vai para login
      this.router.navigate(['/register/login']);
    });
  }

  private processGoogleLogin(response: { userName: string, email: string, token: string, refreshToken: string }): void {
    // Inicia sessão e registro em background, redireciona imediatamente
    this.authService.handleGoogleLoginCallback(response);
    this.router.navigate(['/match']);
  }
}
