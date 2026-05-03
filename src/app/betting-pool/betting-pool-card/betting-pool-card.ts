import { ChangeDetectionStrategy, Component, OnDestroy, computed, input, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { BettingPoolResponse } from '../betting-pool-api.service';

const VISIBLE_LIMIT = 5;

@Component({
  selector: 'app-betting-pool-card',
  standalone: true,
  templateUrl: './betting-pool-card.html',
  styleUrl: './betting-pool-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BettingPoolCard implements OnDestroy {
  readonly pool = input.required<BettingPoolResponse>();

  protected readonly expanded = signal(false);
  protected readonly shareModalOpen = signal(false);
  protected readonly linkCopied = signal(false);
  private copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly sortedUsers = computed(() =>
    [...this.pool().users].sort((a, b) => b.points - a.points)
  );

  protected readonly visibleUsers = computed(() => {
    const sorted = this.sortedUsers();
    return this.expanded() ? sorted : sorted.slice(0, VISIBLE_LIMIT);
  });

  protected readonly hasMore = computed(() => this.pool().users.length > VISIBLE_LIMIT);
  protected readonly hiddenCount = computed(() => this.pool().users.length - VISIBLE_LIMIT);

  protected readonly shareLink = computed(
    () => `${environment.toxicBetApiBaseUrl}/bettingPool/${this.pool().bettingPoolKey}`
  );

  protected copyKey(): void {
    navigator.clipboard.writeText(this.pool().bettingPoolKey);
  }

  protected openShare(): void {
    this.shareModalOpen.set(true);
  }

  protected closeShare(): void {
    this.shareModalOpen.set(false);
    this.linkCopied.set(false);
  }

  protected copyLink(): void {
    navigator.clipboard.writeText(this.shareLink());
    this.linkCopied.set(true);
    if (this.copyResetTimer) clearTimeout(this.copyResetTimer);
    this.copyResetTimer = setTimeout(() => this.linkCopied.set(false), 2000);
  }

  protected collapse(): void {
    this.expanded.set(false);
  }

  ngOnDestroy(): void {
    if (this.copyResetTimer) clearTimeout(this.copyResetTimer);
  }
}

