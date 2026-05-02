import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap, filter, take } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApplicationTokenService } from '../register/services/application-token.service';

export interface Championship {
  idChampionship: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class ChampionshipApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.toxicBetApiBaseUrl;
  private readonly applicationTokenService = inject(ApplicationTokenService);

  getChampionships(): Observable<Championship[]> {
    // Aguarda o token estar disponível antes de fazer a chamada
    return this.applicationTokenService.applicationToken$
      .pipe(
        filter((token): token is string => !!token),
        take(1),
        switchMap(token => {
          const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
          return this.http.get<Championship[]>(`${this.baseUrl}/championship`, { headers });
        })
      );
  }
}
