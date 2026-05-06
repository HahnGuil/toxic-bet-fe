import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

import { MatchResponse } from '../../match/match-api.service';
import { CloseMatchResult } from '../../match/match-api.service';

export interface AdminMatchCardState {
  matchId: number;
  checked: boolean;
  result: CloseMatchResult | null;
  homeTeamScore: number | null;
  visitingTeamScore: number | null;
}

@Component({
  selector: 'app-admin-match-card',
  standalone: true,
  imports: [],
  templateUrl: './admin-match-card.html',
  styleUrl: './admin-match-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminMatchCard {
  readonly match = input.required<MatchResponse>();
  readonly invalid = input<boolean>(false);

  protected readonly checked = signal(false);
  protected readonly selectedResult = signal<CloseMatchResult | null>(null);
  protected readonly homeTeamScore = signal('');
  protected readonly visitingTeamScore = signal('');

  readonly stateChange = output<AdminMatchCardState>();

  protected onCheckboxChange(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.checked.set(isChecked);
    this.emitState();
  }

  protected onResultChange(result: CloseMatchResult): void {
    this.selectedResult.set(result);
    this.emitState();
  }

  protected onHomeScoreInput(event: Event): void {
    this.homeTeamScore.set((event.target as HTMLInputElement).value);
    this.emitState();
  }

  protected onVisitingScoreInput(event: Event): void {
    this.visitingTeamScore.set((event.target as HTMLInputElement).value);
    this.emitState();
  }

  private emitState(): void {
    this.stateChange.emit({
      matchId: this.match().matchId,
      checked: this.checked(),
      result: this.selectedResult(),
      homeTeamScore: this.parseScore(this.homeTeamScore()),
      visitingTeamScore: this.parseScore(this.visitingTeamScore()),
    });
  }

  private parseScore(value: string): number | null {
    if (!/^\d+$/.test(value.trim())) return null;
    return Number(value);
  }
}
