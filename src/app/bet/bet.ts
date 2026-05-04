import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { AppFooter } from '../shared/footer/footer';
import { AppHeader } from '../shared/header/header';
import { BetCard } from './bet-card/bet-card';
import { OpenBetCard } from './open-bet-card/open-bet-card';
import { BetResultDTO, OpenBetResultDTO, BetResultsApiService } from './bet-results-api.service';

@Component({
  selector: 'app-bet',
  standalone: true,
  imports: [AppHeader, AppFooter, BetCard, OpenBetCard],
  templateUrl: './bet.html',
  styleUrl: './bet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Bet implements OnInit {
  private readonly betResultsApi = inject(BetResultsApiService);

  protected readonly isPageTransitioning = signal(false);
  protected readonly selectedBetView = signal<'all' | 'open'>('all');
  protected readonly betResults = signal<BetResultDTO[]>([]);
  protected readonly openBetResults = signal<OpenBetResultDTO[]>([]);
  protected readonly loadError = signal(false);
  protected readonly openLoadError = signal(false);

  private resultsSub: Subscription | null = null;
  private openResultsSub: Subscription | null = null;

  ngOnInit(): void {
    this.loadOpenBetResults();
  }

  protected selectBetView(view: 'all' | 'open'): void {
    this.selectedBetView.set(view);
    if (view === 'open') {
      this.loadBetResults();
    } else {
      this.loadOpenBetResults();
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

  private loadOpenBetResults(): void {
    this.openResultsSub?.unsubscribe();
    this.openLoadError.set(false);
    this.openResultsSub = this.betResultsApi.getOpenBetResults().subscribe((data) => {
      if (data === null) {
        this.openLoadError.set(true);
        this.openBetResults.set([]);
      } else {
        this.openBetResults.set(data);
      }
    });
  }
}
