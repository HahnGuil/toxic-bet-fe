import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

import { MatchResponse } from '../../match/match-api.service';
import { CloseMatchResult } from '../../match/match-api.service';

export interface AdminMatchCardState {
  matchId: number;
  checked: boolean;
  result: CloseMatchResult | null;
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

  readonly stateChange = output<AdminMatchCardState>();

  protected onCheckboxChange(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.checked.set(isChecked);
    this.stateChange.emit({ matchId: this.match().matchId, checked: isChecked, result: this.selectedResult() });
  }

  protected onResultChange(result: CloseMatchResult): void {
    this.selectedResult.set(result);
    this.stateChange.emit({ matchId: this.match().matchId, checked: this.checked(), result });
  }
}
