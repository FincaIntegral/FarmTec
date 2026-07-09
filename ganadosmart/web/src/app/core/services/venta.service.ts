import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiEndpoints } from '../api/config/api-endpoints';
import { ApiClientService } from '../api/http/api-client.service';
import { PaginatedResponseModel } from '../models/pagination.model';
import {
  VentaCreateRequestModel,
  VentaDetailModel,
  VentaFilterModel,
  VentaRechazarRequestModel,
} from '../models/venta';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private readonly apiClient = inject(ApiClientService);

  listar(filtro: VentaFilterModel): Observable<PaginatedResponseModel<VentaDetailModel>> {
    const params: Record<string, unknown> = {};
    if (filtro.estadoAprobacion) params['estadoAprobacion'] = filtro.estadoAprobacion;
    if (filtro.soloMisAprobaciones) params['soloMisAprobaciones'] = filtro.soloMisAprobaciones;
    if (filtro.fechaInicio) params['fechaInicio'] = filtro.fechaInicio;
    if (filtro.fechaFin) params['fechaFin'] = filtro.fechaFin;
    if (filtro.pagina) params['pagina'] = filtro.pagina;
    if (filtro.limite) params['limite'] = filtro.limite;

    return this.apiClient.get<PaginatedResponseModel<VentaDetailModel>>(apiEndpoints.VENTAS.LIST, undefined, {
      params,
    });
  }

  crear(dto: VentaCreateRequestModel): Observable<VentaDetailModel> {
    return this.apiClient.post<VentaDetailModel>(apiEndpoints.VENTAS.CREATE, dto);
  }

  aprobar(id: string): Observable<VentaDetailModel> {
    return this.apiClient.patch<VentaDetailModel>(apiEndpoints.VENTAS.APPROVE, undefined, { id });
  }

  rechazar(id: string, dto: VentaRechazarRequestModel): Observable<VentaDetailModel> {
    return this.apiClient.patch<VentaDetailModel>(apiEndpoints.VENTAS.REJECT, dto, { id });
  }
}
