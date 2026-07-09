import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiEndpoints } from '../api/config/api-endpoints';
import { ApiClientService } from '../api/http/api-client.service';
import { PaginatedResponseModel } from '../models/pagination.model';
import {
  GastoCreateRequestModel,
  GastoDetailModel,
  GastoFilterModel,
  GastoRechazarRequestModel,
} from '../models/gasto';

@Injectable({ providedIn: 'root' })
export class GastoService {
  private readonly apiClient = inject(ApiClientService);

  listar(filtro: GastoFilterModel): Observable<PaginatedResponseModel<GastoDetailModel>> {
    const params: Record<string, unknown> = {};
    if (filtro.categoria) params['categoria'] = filtro.categoria;
    if (filtro.estadoAprobacion) params['estadoAprobacion'] = filtro.estadoAprobacion;
    if (filtro.soloMisAprobaciones) params['soloMisAprobaciones'] = filtro.soloMisAprobaciones;
    if (filtro.pagina) params['pagina'] = filtro.pagina;
    if (filtro.limite) params['limite'] = filtro.limite;

    return this.apiClient.get<PaginatedResponseModel<GastoDetailModel>>(apiEndpoints.GASTOS.LIST, undefined, {
      params,
    });
  }

  crear(dto: GastoCreateRequestModel): Observable<GastoDetailModel> {
    return this.apiClient.post<GastoDetailModel>(apiEndpoints.GASTOS.CREATE, dto);
  }

  aprobar(id: string): Observable<GastoDetailModel> {
    return this.apiClient.patch<GastoDetailModel>(apiEndpoints.GASTOS.APPROVE, undefined, { id });
  }

  rechazar(id: string, dto: GastoRechazarRequestModel): Observable<GastoDetailModel> {
    return this.apiClient.patch<GastoDetailModel>(apiEndpoints.GASTOS.REJECT, dto, { id });
  }
}
