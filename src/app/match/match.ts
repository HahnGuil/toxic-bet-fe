import { ChangeDetectionStrategy, Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, timer } from 'rxjs';
import { retry } from 'rxjs/operators';
import { ChampionshipApiService, Championship } from './championship-api.service';
import { MatchApiService, MatchResponse } from './match-api.service';
import { BetApiService } from './bet-api.service';
import { MatchCard } from './match-card/match-card';
import { LoggerService } from '../logger.service';
import { PushNotificationService } from '../notifications/push-notification.service';
import { AppFooter } from '../shared/footer/footer';
import { AppHeader } from '../shared/header/header';
import { AppDropdown } from '../shared/dropdown/dropdown';

@Component({
  selector: 'app-match',
  standalone: true,
  imports: [CommonModule, MatchCard, AppFooter, AppHeader, AppDropdown],
  templateUrl: './match.html',
  styleUrl: './match.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Match implements OnDestroy {
  private readonly championshipApi = inject(ChampionshipApiService);
  private readonly matchApi = inject(MatchApiService);
  private readonly betApi = inject(BetApiService);
  private readonly logger = inject(LoggerService);
  protected readonly pushNotifications = inject(PushNotificationService);

  protected readonly championships = signal<Championship[]>([]);
  protected readonly selectedChampionship = signal<Championship | null>(null);
  protected readonly isLoadingChampionships = signal(false);

  protected readonly championshipOptions = computed(() =>
    this.championships().map((c) => ({ value: String(c.idChampionship), label: c.name }))
  );
  protected readonly selectedChampionshipValue = computed(() =>
    this.selectedChampionship() ? String(this.selectedChampionship()!.idChampionship) : ''
  );
  protected readonly matches = signal<MatchResponse[]>([]);
  protected readonly openMatches = signal<MatchResponse[]>([]);
  protected readonly bettedMatchIds = signal<Set<number>>(new Set());
  protected readonly notificationBannerDismissed = signal(false);

  protected readonly showNotificationBanner = computed(() =>
    this.pushNotifications.isSupported()
    && !this.pushNotifications.isSubscribed()
    && !this.notificationBannerDismissed()
  );

  protected readonly filteredOpenMatches = computed(() => {
    const betted = this.bettedMatchIds();
    return this.openMatches().filter((m) => !betted.has(m.matchId));
  });

  private matchStreamSub: Subscription | null = null;
  private openMatchStreamSub: Subscription | null = null;
  private userBetsSub: Subscription | null = null;

  constructor() {
    this.pushNotifications.initialize();
    this.loadChampionships();
    this.loadActiveMatchStream();
    this.loadUserBetsSnapshot();
  }

  private loadActiveMatchStream(): void {
    this.matchStreamSub?.unsubscribe();
    this.openMatchStreamSub?.unsubscribe();

    if (this.selectedMatchView() === 'all') {
      this.loadMatches();
      return;
    }

    this.loadOpenMatches();
  }

  private loadMatches(): void {
    this.matches.set([]);
    const source$ = this.selectedChampionship()
      ? this.matchApi.streamMatchesByChampionship(this.selectedChampionship()!.idChampionship)
      : this.matchApi.streamAllMatches();

    this.matchStreamSub = source$.pipe(this.retryStream()).subscribe({
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
    this.openMatches.set([]);
    const source$ = this.selectedChampionship()
      ? this.matchApi.streamOpenBettingMatchesByChampionship(this.selectedChampionship()!.idChampionship)
      : this.matchApi.streamOpenBettingMatches();

    this.openMatchStreamSub = source$.pipe(this.retryStream()).subscribe({
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

  private loadUserBetsSnapshot(): void {
    this.userBetsSub?.unsubscribe();
    this.userBetsSub = this.betApi.loadUserBetsSnapshot().subscribe({
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

  protected enableNotifications(): void {
    this.pushNotifications.enable().subscribe((enabled) => {
      if (!enabled) {
        this.logger.error('[Notifications] user did not enable push notifications');
      }
    });
  }

  protected dismissNotificationBanner(): void {
    this.notificationBannerDismissed.set(true);
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

    protected onChampionshipChange(value: string): void {
      if (!value) {
        this.selectedChampionship.set(null);
        this.loadActiveMatchStream();
        return;
      }
      const id = Number(value);
      const champ = this.championships().find((c: Championship) => c.idChampionship === id) || null;
      if (champ) {
        this.selectChampionship(champ);
      }
    }
  protected selectChampionship(champ: Championship): void {
    this.selectedChampionship.set(champ);
    this.loadActiveMatchStream();
  }

  protected readonly isPageTransitioning = signal(false);
  protected readonly selectedMatchView = signal<'all' | 'open'>('open');

  protected selectMatchView(view: 'all' | 'open'): void {
    if (this.selectedMatchView() === view) {
      return;
    }

    this.selectedMatchView.set(view);
    this.loadActiveMatchStream();
  }

  private retryStream<T>() {
    return retry<T>({
      delay: (_error, retryCount) => timer(Math.min(1000 * retryCount, 10000)),
    });
  }
}
