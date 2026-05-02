

import { ChangeDetectionStrategy, Component, inject, signal, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChampionshipApiService, Championship } from './championship-api.service';
import { MatchApiService, MatchResponse } from './match-api.service';
import { MatchCard } from './match-card/match-card';
import { AuthService } from '../register/services/auth.service';
import { AuthSessionService } from '../register/services/auth-session.service';

@Component({
  selector: 'app-match',
  standalone: true,
  imports: [CommonModule, MatchCard],
  templateUrl: './match.html',
  styleUrl: './match.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Match implements OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authSessionService = inject(AuthSessionService);

  private readonly championshipApi = inject(ChampionshipApiService);
  private readonly matchApi = inject(MatchApiService);

  protected readonly championships = signal<Championship[]>([]);
  protected readonly selectedChampionship = signal<Championship | null>(null);
  protected readonly isLoadingChampionships = signal(false);
  protected readonly matches = signal<MatchResponse[]>([]);
  protected readonly openMatches = signal<MatchResponse[]>([]);

  private matchStreamSub: Subscription | null = null;
  private openMatchStreamSub: Subscription | null = null;

  constructor() {
    this.loadChampionships();
    this.loadMatches();
    this.loadOpenMatches();
  }

  private loadMatches(): void {
    this.matchStreamSub = this.matchApi.streamAllMatches().subscribe({
      next: (match) => {
        console.log('[Match] received match from stream:', match);
        this.matches.update((current) => {
          const idx = current.findIndex((m) => m.matchId === match.matchId);
          if (idx >= 0) {
            const updated = [...current];
            updated[idx] = match;
            return updated;
          }
          return [...current, match];
        });
      },
      error: (err) => {
        console.error('[Match] stream error:', err);
      },
      complete: () => {
        console.log('[Match] stream completed');
      },
    });
  }

  private loadOpenMatches(): void {
    this.openMatchStreamSub = this.matchApi.streamOpenBettingMatches().subscribe({
      next: (match) => {
        console.log('[Match] received open match from stream:', match);
        this.openMatches.update((current) => {
          const idx = current.findIndex((m) => m.matchId === match.matchId);
          if (idx >= 0) {
            const updated = [...current];
            updated[idx] = match;
            return updated;
          }
          return [...current, match];
        });
      },
      error: (err) => {
        console.error('[Match] open stream error:', err);
      },
      complete: () => {
        console.log('[Match] open stream completed');
      },
    });
  }

  ngOnDestroy(): void {
    this.matchStreamSub?.unsubscribe();
    this.openMatchStreamSub?.unsubscribe();
  }

  protected loadChampionships(): void {
    this.isLoadingChampionships.set(true);
    this.championshipApi.getChampionships().subscribe({
      next: (data) => {
        this.championships.set(data);
        this.isLoadingChampionships.set(false);
      },
      error: () => {
        this.championships.set([]);
        this.isLoadingChampionships.set(false);
      },
    });
  }

    protected onChampionshipChange(event: Event): void {
      const select = event.target as HTMLSelectElement;
      const id = Number(select.value);
      const champ = this.championships().find((c: Championship) => c.idChampionship === id) || null;
      if (champ) {
        this.selectChampionship(champ);
      }
    }
  protected selectChampionship(champ: Championship): void {
    this.selectedChampionship.set(champ);
  }

  protected readonly isLoggingOut = signal(false);
  protected readonly isPageTransitioning = signal(false);
  protected readonly selectedMatchView = signal<'all' | 'open'>('all');

  protected selectMatchView(view: 'all' | 'open'): void {
    this.selectedMatchView.set(view);
  }

  protected logoff(): void {
    if (this.isLoggingOut()) {
      return;
    }

    const email = this.authSessionService.getSessionEmail();
    if (!email) {
      this.authSessionService.clearSession();
      this.router.navigate(['/register/login']);
      return;
    }

    this.isLoggingOut.set(true);

    this.authService.logout(email).subscribe({
      next: async () => {
        this.authSessionService.clearSession();
        this.isPageTransitioning.set(true);

        setTimeout(async () => {
          await this.router.navigate(['/register/login']);
        }, 220);
      },
      error: () => {
        this.isLoggingOut.set(false);
      },
    });
  }
}
