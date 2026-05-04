import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { BetResultDTO, MatchResult } from '../bet-results-api.service';

const RESULT_LABELS: Record<MatchResult, string> = {
  HOME_WIN: 'MANDANTE',
  VISITING_WIN: 'VISITANTE',
  DRAW: 'EMPATE',
};

@Component({
  selector: 'app-bet-card',
  standalone: true,
  imports: [],
  templateUrl: './bet-card.html',
  styleUrl: './bet-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BetCard {
  readonly bet = input.required<BetResultDTO>();

  protected isWinner(): boolean {
    return this.bet().matchResult === this.bet().betResult;
  }

  protected resultLabel(result: MatchResult): string {
    return RESULT_LABELS[result] ?? result;
  }
}
