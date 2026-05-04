import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { MatchResponse, MatchResult } from '../match-api.service';
import { BetApiService, BetResult } from '../bet-api.service';

type OddType = 'home' | 'draw' | 'visiting';

const ODD_TO_RESULT: Record<OddType, BetResult> = {
  home: 'HOME_WIN',
  draw: 'DRAW',
  visiting: 'VISITING_WIN',
};

const RESULT_LABELS: Record<MatchResult, string> = {
  HOME_WIN: 'MANDANTE',
  VISITING_WIN: 'VISITING WIN',
  DRAW: 'DRAW',
  NOT_STARTED: 'NOT STARTED',
  IN_PROGRESS: 'IN PROGRESS',
  OPEN_FOR_BETTING: 'OPEN FOR BET',
};

const RESULT_CLASSES: Record<MatchResult, string> = {
  HOME_WIN: 'result-win',
  VISITING_WIN: 'result-win',
  DRAW: 'result-draw',
  NOT_STARTED: 'result-not-started',
  IN_PROGRESS: 'result-in-progress',
  OPEN_FOR_BETTING: 'result-open',
};

@Component({
  selector: 'app-match-card',
  standalone: true,
  imports: [],
  templateUrl: './match-card.html',
  styleUrl: './match-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchCard {
  readonly match = input.required<MatchResponse>();
  readonly betPlaced = output<number>();

  private readonly betApi = inject(BetApiService);

  // Snapshot taken when user selects an odd — freezes displayed values
  protected readonly frozenMatch = signal<MatchResponse | null>(null);
  protected readonly displayedMatch = computed(() => this.frozenMatch() ?? this.match());

  protected readonly selectedOdd = signal<OddType | null>(null);

  // "select an odd first" error
  protected readonly showSelectOddError = signal(false);

  // Odds-changed confirmation popup
  protected readonly showOddsChangedPopup = signal(false);
  protected readonly updatedOddsValue = signal(0);

  // Submission state
  protected readonly isSubmitting = signal(false);
  protected readonly showSuccess = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected toggleOdd(odd: OddType): void {
    if (this.selectedOdd() === odd) {
      this.selectedOdd.set(null);
      this.frozenMatch.set(null);
    } else {
      this.selectedOdd.set(odd);
      this.frozenMatch.set(this.match());
      this.showSelectOddError.set(false);
    }
  }

  protected placeBet(): void {
    const odd = this.selectedOdd();
    if (!odd) {
      this.showSelectOddError.set(true);
      return;
    }

    const frozen = this.frozenMatch() ?? this.match();
    const live = this.match();

    const frozenValue = this.getOddValue(odd, frozen);
    const liveValue = this.getOddValue(odd, live);

    if (frozenValue !== liveValue) {
      this.updatedOddsValue.set(liveValue);
      this.showOddsChangedPopup.set(true);
    } else {
      this.submitBet(odd, liveValue);
    }
  }

  protected confirmBet(): void {
    const odd = this.selectedOdd();
    if (!odd) return;
    const liveValue = this.getOddValue(odd, this.match());
    this.showOddsChangedPopup.set(false);
    this.submitBet(odd, liveValue);
  }

  protected cancelBet(): void {
    this.showOddsChangedPopup.set(false);
    this.selectedOdd.set(null);
    this.frozenMatch.set(null);
  }

  private submitBet(odd: OddType, oddsValue: number): void {
    this.isSubmitting.set(true);
    this.submitError.set(null);

    this.betApi.placeBet({
      matchId: this.match().matchId,
      result: ODD_TO_RESULT[odd],
      odds: oddsValue,
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showSuccess.set(true);
        this.selectedOdd.set(null);
        this.frozenMatch.set(null);
        this.betPlaced.emit(this.match().matchId);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        const body = err.error as { message?: string } | null;
        this.submitError.set(body?.message ?? 'Unable to place your bet. Please try again later.');
      },
    });
  }

  private getOddValue(odd: OddType, match: MatchResponse): number {
    switch (odd) {
      case 'home': return match.homeTeamOdds;
      case 'draw': return match.drawTeamOdds;
      case 'visiting': return match.visitingTeamOdds;
    }
  }

  protected dismissSelectOddError(): void { this.showSelectOddError.set(false); }
  protected dismissSubmitError(): void { this.submitError.set(null); }
  protected dismissSuccess(): void { this.showSuccess.set(false); }

  protected resultLabel(result: MatchResult): string {
    return RESULT_LABELS[result] ?? result;
  }

  protected resultClass(result: MatchResult): string {
    return RESULT_CLASSES[result] ?? '';
  }

  protected formatOdds(value: number): string {
    return value.toFixed(1);
  }
}

