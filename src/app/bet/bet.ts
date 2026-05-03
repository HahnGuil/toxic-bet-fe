import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { AppFooter } from '../shared/footer/footer';
import { AppHeader } from '../shared/header/header';

@Component({
  selector: 'app-bet',
  standalone: true,
  imports: [AppHeader, AppFooter],
  templateUrl: './bet.html',
  styleUrl: './bet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Bet {
  protected readonly isPageTransitioning = signal(false);
}
