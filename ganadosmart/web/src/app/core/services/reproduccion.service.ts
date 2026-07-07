import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiEndpoints } from '../api/config/api-endpoints';
import { ApiClientService } from '../api/http/api-client.service';
import { PaginatedResponseModel } from '../models/pagination.model';
import {
  ReproduccionConfirmarPartoRequestModel,
  ReproduccionCreateRequestModel,
  ReproduccionDetailModel,
  ReproduccionFilterModel,
} from '../models/reproduccion';

@Injectable({ providedIn: 'root' })
export class ReproduccionService {
  private readonly apiClient = inject(ApiClientService);

  listar(filtro: ReproduccionFilterModel): Observable<PaginatedResponseModel<ReproduccionDetailModel>> {
    const params: Record<string, unknown> = {};
    if (filtro.estado) params['estado'] = filtro.estado;
    if (filtro.vacaId) params['vacaId'] = filtro.vacaId;
    if (filtro.pagina) params['pagina'] = filtro.pagina;
    if (filtro.limite) params['limite'] = filtro.limite;

    return this.apiClient.get<PaginatedResponseModel<ReproduccionDetailModel>>(
      apiEndpoints.REPRODUCCION.LIST,
      undefined,
      { params },
    );
  }

  crear(dto: ReproduccionCreateRequestModel): Observable<ReproduccionDetailModel> {
    return this.apiClient.post<ReproduccionDetailModel>(apiEndpoints.REPRODUCCION.CREATE, dto);
  }

  confirmarParto(
    id: string,
    dto: ReproduccionConfirmarPartoRequestModel,
  ): Observable<ReproduccionDetailModel> {
    return this.apiClient.patch<ReproduccionDetailModel>(apiEndpoints.REPRODUCCION.CONFIRM_PARTO, dto, { id });
  }
}
