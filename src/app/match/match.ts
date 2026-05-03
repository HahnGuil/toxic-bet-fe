

import { ChangeDetectionStrategy, Component, inject, signal, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChampionshipApiService, Championship } from './championship-api.service';
import { MatchApiService, MatchResponse } from './match-api.service';
import { BetApiService } from './bet-api.service';
import { MatchCard } from './match-card/match-card';
import { LoggerService } from '../logger.service';
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
  private readonly betApi = inject(BetApiService);
  private readonly logger = inject(LoggerService);

  protected readonly championships = signal<Championship[]>([]);
  protected readonly selectedChampionship = signal<Championship | null>(null);
  protected readonly isLoadingChampionships = signal(false);
  protected readonly matches = signal<MatchResponse[]>([]);
  protected readonly openMatches = signal<MatchResponse[]>([]);
  protected readonly bettedMatchIds = signal<Set<number>>(new Set());

  protected readonly filteredOpenMatches = computed(() => {
    const betted = this.bettedMatchIds();
    return this.openMatches().filter((m) => !betted.has(m.matchId));
  });

  private matchStreamSub: Subscription | null = null;
  private openMatchStreamSub: Subscription | null = null;
  private userBetsSub: Subscription | null = null;

  constructor() {
    this.loadChampionships();
    this.loadMatches();
    this.loadOpenMatches();
    this.loadUserBets();
  }

  private loadMatches(): void {
    this.matchStreamSub?.unsubscribe();
    this.matches.set([]);
    const source$ = this.selectedChampionship()
      ? this.matchApi.streamMatchesByChampionship(this.selectedChampionship()!.idChampionship)
      : this.matchApi.streamAllMatches();

    this.matchStreamSub = source$.subscribe({
      next: (match) => {
        const isUpdate = this.matches().some((m) => m.matchId === match.matchId);
        this.logger.info(
          isUpdate ? '[Stream:AllMatches] match updated' : '[Stream:AllMatches] match received',
          { matchId: match.matchId, championship: match.championshipName, result: match.result },
        );
        this.matches.update((current) => this.upsert(current, match));
      },
      error: (err) => this.logger.error('[Stream:AllMatches] error', { message: String(err) }),
      complete: () => this.logger.info('[Stream:AllMatches] stream completed'),
    });
  }

  private loadOpenMatches(): void {
    this.openMatchStreamSub?.unsubscribe();
    this.openMatches.set([]);
    const source$ = this.selectedChampionship()
      ? this.matchApi.streamOpenBettingMatchesByChampionship(this.selectedChampionship()!.idChampionship)
      : this.matchApi.streamOpenBettingMatches();

    this.openMatchStreamSub = source$.subscribe({
      next: (match) => {
        const isUpdate = this.openMatches().some((m) => m.matchId === match.matchId);
        this.logger.info(
          isUpdate ? '[Stream:OpenMatches] match updated' : '[Stream:OpenMatches] match received',
          { matchId: match.matchId, championship: match.championshipName, result: match.result },
        );
        this.openMatches.update((current) => this.upsert(current, match));
      },
      error: (err) => this.logger.error('[Stream:OpenMatches] error', { message: String(err) }),
      complete: () => this.logger.info('[Stream:OpenMatches] stream completed'),
    });
  }

  private upsert(list: MatchResponse[], match: MatchResponse): MatchResponse[] {
    const idx = list.findIndex((m) => m.matchId === match.matchId);
    if (idx >= 0) {
      const updated = [...list];
      updated[idx] = match;
      return updated;
    }
    return [...list, match];
  }

  ngOnDestroy(): void {
    this.matchStreamSub?.unsubscribe();
    this.openMatchStreamSub?.unsubscribe();
    this.userBetsSub?.unsubscribe();
  }

  private loadUserBets(): void {
    this.userBetsSub = this.betApi.streamUserBets().subscribe({
      next: (bet) => {
        if (bet.matchId != null) {
          this.logger.info('[Stream:UserBets] bet received', { matchId: bet.matchId, result: bet.result, odds: bet.odds });
          this.bettedMatchIds.update((current) => new Set([...current, bet.matchId!]));
        }
      },
      error: (err) => this.logger.error('[Stream:UserBets] error', { message: String(err) }),
    });
  }

  protected onBetPlaced(matchId: number): void {
    const wasInOpenList = this.filteredOpenMatches().some((m) => m.matchId === matchId);
    this.bettedMatchIds.update((current) => new Set([...current, matchId]));
    this.logger.info('[Bet] bet placed by user', {
      matchId,
      removedFromOpenToBet: wasInOpenList,
    });
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
    this.loadMatches();
    this.loadOpenMatches();
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
