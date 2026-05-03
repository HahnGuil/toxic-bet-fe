import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { AppFooter } from '../shared/footer/footer';
import { AppHeader } from '../shared/header/header';
import { BetCard } from './bet-card/bet-card';
import { BetResultDTO, BetResultsApiService } from './bet-results-api.service';

@Component({
  selector: 'app-bet',
  standalone: true,
  imports: [AppHeader, AppFooter, BetCard],
  templateUrl: './bet.html',
  styleUrl: './bet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Bet {
  private readonly betResultsApi = inject(BetResultsApiService);

  protected readonly isPageTransitioning = signal(false);
  protected readonly selectedBetView = signal<'all' | 'open'>('all');
  protected readonly betResults = signal<BetResultDTO[]>([]);
  protected readonly loadError = signal(false);

  private resultsSub: Subscription | null = null;

  protected selectBetView(view: 'all' | 'open'): void {
    this.selectedBetView.set(view);
    if (view === 'open') {
      this.loadBetResults();
    }
  }

  private loadBetResults(): void {
    this.resultsSub?.unsubscribe();
    this.loadError.set(false);
    this.resultsSub = this.betResultsApi.getBetResults().subscribe((data) => {
      if (data === null) {
        this.loadError.set(true);
        this.betResults.set([]);
      } else {
        this.betResults.set(data);
      }
    });
  }
}
