import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiEndpoints } from '../api/config/api-endpoints';
import { ApiClientService } from '../api/http/api-client.service';
import {
  MovimientoGanadoCreateRequestModel,
  MovimientoGanadoDetailModel,
  MovimientoGanadoFilterModel,
} from '../models/movimiento-ganado';
import { PaginatedResponseModel } from '../models/pagination.model';
import {
  PotreroCreateRequestModel,
  PotreroDetailModel,
  PotreroSummaryModel,
  PotreroUpdateRequestModel,
} from '../models/potrero';

@Injectable({ providedIn: 'root' })
export class PotreroService {
  private readonly apiClient = inject(ApiClientService);

  listar(): Observable<PotreroSummaryModel[]> {
    return this.apiClient.get<PotreroSummaryModel[]>(apiEndpoints.POTREROS.LIST);
  }

  crear(dto: PotreroCreateRequestModel): Observable<PotreroDetailModel> {
    return this.apiClient.post<PotreroDetailModel>(apiEndpoints.POTREROS.CREATE, dto);
  }

  actualizar(id: string, dto: PotreroUpdateRequestModel): Observable<PotreroDetailModel> {
    return this.apiClient.patch<PotreroDetailModel>(apiEndpoints.POTREROS.DETAIL, dto, { id });
  }

  listarMovimientos(
    filtro: MovimientoGanadoFilterModel,
  ): Observable<PaginatedResponseModel<MovimientoGanadoDetailModel>> {
    const params: Record<string, unknown> = {};
    if (filtro.animalId) params['animalId'] = filtro.animalId;
    if (filtro.potreroId) params['potreroId'] = filtro.potreroId;
    if (filtro.pagina) params['pagina'] = filtro.pagina;
    if (filtro.limite) params['limite'] = filtro.limite;

    return this.apiClient.get<PaginatedResponseModel<MovimientoGanadoDetailModel>>(
      apiEndpoints.POTREROS.MOVIMIENTOS,
      undefined,
      { params },
    );
  }

  registrarMovimiento(
    dto: MovimientoGanadoCreateRequestModel,
  ): Observable<MovimientoGanadoDetailModel> {
    return this.apiClient.post<MovimientoGanadoDetailModel>(apiEndpoints.POTREROS.MOVIMIENTOS, dto);
  }
}
