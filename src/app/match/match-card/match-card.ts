import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

import { MatchResponse, MatchResult } from '../match-api.service';

type OddType = 'home' | 'draw' | 'visiting';

const RESULT_LABELS: Record<MatchResult, string> = {
  HOME_WIN: 'HOME WIN',
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

  protected readonly selectedOdd = signal<OddType | null>(null);
  protected readonly showBetError = signal(false);

  protected toggleOdd(odd: OddType): void {
    this.selectedOdd.set(this.selectedOdd() === odd ? null : odd);
  }

  protected placeBet(): void {
    if (this.selectedOdd() === null) {
      this.showBetError.set(true);
    }
  }

  protected dismissError(): void {
    this.showBetError.set(false);
  }

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
