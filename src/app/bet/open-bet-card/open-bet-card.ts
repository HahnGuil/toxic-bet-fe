import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { MatchResult, OpenBetResultDTO } from '../bet-results-api.service';

const RESULT_LABELS: Record<MatchResult, string> = {
  HOME_WIN: 'MANDANTE',
  VISITING_WIN: 'VISITANTE',
  DRAW: 'EMPATE',
};

@Component({
  selector: 'app-open-bet-card',
  standalone: true,
  imports: [],
  templateUrl: './open-bet-card.html',
  styleUrl: './open-bet-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenBetCard {
  readonly bet = input.required<OpenBetResultDTO>();

  protected betResultLabel(): string {
    return RESULT_LABELS[this.bet().betResult] ?? this.bet().betResult;
  }

  protected matchStatusLabel(): string {
    return this.bet().matchResult === 'IN_PROGRESS'
      ? 'Partida em Andamento'
      : 'Partida aberta para apostas';
  }
}
