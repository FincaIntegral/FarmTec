import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiEndpoints } from '../api/config/api-endpoints';
import { ApiClientService } from '../api/http/api-client.service';
import { DashboardModel, MortalidadRegistroModel } from '../models/reporte';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly apiClient = inject(ApiClientService);

  dashboard(): Observable<DashboardModel> {
    return this.apiClient.get<DashboardModel>(apiEndpoints.REPORTES.DASHBOARD);
  }

  mortalidad(): Observable<MortalidadRegistroModel[]> {
    return this.apiClient.get<MortalidadRegistroModel[]>(apiEndpoints.REPORTES.MORTALIDAD);
  }
}
