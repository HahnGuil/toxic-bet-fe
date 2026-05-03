import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { AppFooter } from '../shared/footer/footer';
import { AppHeader } from '../shared/header/header';

@Component({
  selector: 'app-base',
  standalone: true,
  imports: [AppFooter, AppHeader],
  templateUrl: './base.html',
  styleUrl: './base.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Base {
  protected readonly isPageTransitioning = signal(false);
}
