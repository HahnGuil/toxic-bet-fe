import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';

type ConnectionState = 'idle' | 'checking' | 'online' | 'offline';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit, OnDestroy {
  protected readonly installAvailable = signal(false);
  protected readonly isOnline = signal(typeof navigator === 'undefined' ? true : navigator.onLine);
  protected readonly apiConnection = signal<ConnectionState>('idle');
  protected readonly authConnection = signal<ConnectionState>('idle');

  private deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

  private readonly onOnline = () => this.isOnline.set(true);
  private readonly onOffline = () => this.isOnline.set(false);
  private readonly onBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    this.deferredInstallPrompt = event as BeforeInstallPromptEvent;
    this.installAvailable.set(true);
  };

  ngOnInit(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
    window.addEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
  }

  ngOnDestroy(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
    window.removeEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
  }

  protected async installApp(): Promise<void> {
    if (!this.deferredInstallPrompt) {
      return;
    }

    await this.deferredInstallPrompt.prompt();
    await this.deferredInstallPrompt.userChoice;
    this.deferredInstallPrompt = null;
    this.installAvailable.set(false);
  }

  protected async checkBackends(): Promise<void> {
    this.apiConnection.set('checking');
    this.authConnection.set('checking');

    const [apiOk, authOk] = await Promise.all([
      this.probeEndpoint('/api/actuator/health'),
      this.probeEndpoint('/auth-server/actuator/health'),
    ]);

    this.apiConnection.set(apiOk ? 'online' : 'offline');
    this.authConnection.set(authOk ? 'online' : 'offline');
  }

  private async probeEndpoint(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}
