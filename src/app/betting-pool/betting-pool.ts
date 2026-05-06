import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { AppFooter } from '../shared/footer/footer';
import { AppHeader } from '../shared/header/header';
import { BettingPoolCard } from './betting-pool-card/betting-pool-card';
import { BettingPoolApiService, BettingPoolResponse } from './betting-pool-api.service';

@Component({
  selector: 'app-betting-pool',
  standalone: true,
  imports: [AppHeader, AppFooter, BettingPoolCard, FormsModule],
  templateUrl: './betting-pool.html',
  styleUrl: './betting-pool.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BettingPool implements OnDestroy {
  private readonly api = inject(BettingPoolApiService);

  protected readonly isPageTransitioning = signal(false);
  protected readonly pools = signal<BettingPoolResponse[]>([]);
  protected readonly leavingPoolKeys = signal<Set<string>>(new Set());

  protected readonly joinModalOpen = signal(false);
  protected readonly joinKey = signal('');
  protected readonly isJoining = signal(false);
  protected readonly joinError = signal<string | null>(null);

  protected readonly createModalOpen = signal(false);
  protected readonly createName = signal('');
  protected readonly isCreating = signal(false);
  protected readonly createError = signal<string | null>(null);

  private sub: Subscription | null = null;

  constructor() {
    this.loadPools();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  protected openCreateModal(): void {
    this.createName.set('');
    this.createError.set(null);
    this.createModalOpen.set(true);
  }

  protected closeCreateModal(): void {
    this.createModalOpen.set(false);
  }

  protected confirmCreate(): void {
    const name = this.createName().trim();
    if (!name || this.isCreating()) return;
    this.createError.set(null);
    this.isCreating.set(true);
    this.api.createPool(name).subscribe({
      next: () => {
        this.isCreating.set(false);
        this.closeCreateModal();
        this.loadPools();
      },
      error: (err) => {
        this.isCreating.set(false);
        const msg =
          err?.error?.message ?? err?.error?.error ?? 'Não foi possível criar o bolão. Tente novamente.';
        this.createError.set(msg);
      },
    });
  }

  protected openJoinModal(): void {
    this.joinKey.set('');
    this.joinError.set(null);
    this.joinModalOpen.set(true);
  }

  protected closeJoinModal(): void {
    this.joinModalOpen.set(false);
  }

  protected confirmJoin(): void {
    const key = this.joinKey().trim();
    if (!key || this.isJoining()) return;
    this.joinError.set(null);
    this.isJoining.set(true);
    this.api.joinPool(key).subscribe({
      next: () => {
        this.isJoining.set(false);
        this.closeJoinModal();
        this.loadPools();
      },
      error: (err) => {
        this.isJoining.set(false);
        const msg =
          err?.error?.message ?? err?.error?.error ?? 'Não foi possível entrar no bolão. Tente novamente.';
        this.joinError.set(msg);
      },
    });
  }

  protected isLeavingPool(bettingPoolKey: string): boolean {
    return this.leavingPoolKeys().has(bettingPoolKey);
  }

  protected leavePool(pool: BettingPoolResponse): void {
    if (this.isLeavingPool(pool.bettingPoolKey)) return;

    const confirmed = window.confirm(`Deseja sair do bolão "${pool.bettingPoolName}"?`);
    if (!confirmed) return;

    this.leavingPoolKeys.update((current) => new Set(current).add(pool.bettingPoolKey));
    this.api.leavePool(pool.bettingPoolKey).subscribe({
      next: () => {
        this.leavingPoolKeys.update((current) => {
          const next = new Set(current);
          next.delete(pool.bettingPoolKey);
          return next;
        });
        this.loadPools();
      },
      error: () => {
        this.leavingPoolKeys.update((current) => {
          const next = new Set(current);
          next.delete(pool.bettingPoolKey);
          return next;
        });
      },
    });
  }

  private loadPools(): void {
    this.sub?.unsubscribe();
    this.sub = this.api.getUserPools().subscribe({
      next: (data) => this.pools.set(data),
      error: () => this.pools.set([]),
    });
  }
}
