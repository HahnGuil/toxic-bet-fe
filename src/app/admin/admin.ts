import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { AppFooter } from '../shared/footer/footer';
import { AppHeader } from '../shared/header/header';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [AppHeader, AppFooter],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin {
  protected readonly isPageTransitioning = signal(false);
}
