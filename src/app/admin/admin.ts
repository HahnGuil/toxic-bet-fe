import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { CloseMatchRequest, MatchApiService, MatchResponse } from '../match/match-api.service';
import { LoggerService } from '../logger.service';
import { AppFooter } from '../shared/footer/footer';
import { AppHeader } from '../shared/header/header';
import { AdminMatchCard, AdminMatchCardState } from './admin-match-card/admin-match-card';
import { CloseMatchResult } from '../match/match-api.service';

interface MatchSelection {
  checked: boolean;
  result: CloseMatchResult | null;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [AppHeader, AppFooter, AdminMatchCard],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin implements OnDestroy {
  private readonly matchApi = inject(MatchApiService);
  private readonly logger = inject(LoggerService);

  protected readonly isPageTransitioning = signal(false);
  protected readonly inProgressMatches = signal<MatchResponse[]>([]);
  protected readonly selections = signal<Map<number, MatchSelection>>(new Map());
  protected readonly invalidMatchIds = signal<Set<number>>(new Set());
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly submitSuccess = signal(false);

  protected readonly hasCheckedMatches = computed(() => {
    for (const [, sel] of this.selections()) {
      if (sel.checked) return true;
    }
    return false;
  });

  private streamSub: Subscription | null = null;
  private submitSub: Subscription | null = null;

  constructor() {
    this.loadInProgressMatches();
  }

  private loadInProgressMatches(): void {
    this.streamSub?.unsubscribe();
    this.inProgressMatches.set([]);
    this.selections.set(new Map());

    this.streamSub = this.matchApi.streamInProgressMatches().subscribe({
      next: (match) => {
        const isUpdate = this.inProgressMatches().some((m) => m.matchId === match.matchId);
        this.logger.info(
          isUpdate ? '[Admin:InProgress] match updated' : '[Admin:InProgress] match received',
          { matchId: match.matchId, championship: match.championshipName },
        );
        this.inProgressMatches.update((current) => {
          const idx = current.findIndex((m) => m.matchId === match.matchId);
          if (idx >= 0) {
            const updated = [...current];
            updated[idx] = match;
            return updated;
          }
          return [...current, match];
        });
      },
      error: (err) => this.logger.error('[Admin:InProgress] stream error', { message: String(err) }),
      complete: () => this.logger.info('[Admin:InProgress] stream completed'),
    });
  }

  protected onCardStateChange(state: AdminMatchCardState): void {
    this.selections.update((map) => {
      const next = new Map(map);
      next.set(state.matchId, { checked: state.checked, result: state.result });
      return next;
    });
    // Clear error for this card once user interacts
    if (this.invalidMatchIds().has(state.matchId)) {
      this.invalidMatchIds.update((set) => {
        const next = new Set(set);
        next.delete(state.matchId);
        return next;
      });
    }
    this.submitSuccess.set(false);
  }

  protected isInvalid(matchId: number): boolean {
    return this.invalidMatchIds().has(matchId);
  }

  protected onSubmit(): void {
    const invalidIds = new Set<number>();
    const payload: CloseMatchRequest[] = [];

    for (const [matchId, sel] of this.selections()) {
      if (!sel.checked) continue;
      if (!sel.result) {
        invalidIds.add(matchId);
      } else {
        payload.push({ matchId, result: sel.result });
      }
    }

    if (invalidIds.size > 0) {
      this.invalidMatchIds.set(invalidIds);
      return;
    }

    if (payload.length === 0) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(false);

    this.submitSub = this.matchApi.closeMatches(payload).subscribe({
      next: () => {
        this.logger.info('[Admin] matches closed successfully', { count: payload.length });
        this.isSubmitting.set(false);
        this.submitSuccess.set(true);
        this.loadInProgressMatches();
      },
      error: (err) => {
        this.logger.error('[Admin] error closing matches', { message: String(err) });
        this.isSubmitting.set(false);
        this.submitError.set('Erro ao encerrar partidas. Tente novamente.');
      },
    });
  }

  ngOnDestroy(): void {
    this.streamSub?.unsubscribe();
    this.submitSub?.unsubscribe();
  }
}

