import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthSessionService } from './register/services/auth-session.service';
import { ApplicationTokenService } from './register/services/application-token.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly applicationTokenService = inject(ApplicationTokenService);

  constructor() {
    this.authSessionService.initializeFromStorage();
    // this.applicationTokenService.initialize(); // Desabilitado temporariamente para teste
  }
}
