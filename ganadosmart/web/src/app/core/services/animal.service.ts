import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiEndpoints } from '../api/config/api-endpoints';
import { ApiClientService } from '../api/http/api-client.service';
import {
  AnimalCreateRequestModel,
  AnimalDetailModel,
  AnimalFilterModel,
  AnimalMortalidadRequestModel,
  AnimalPesoRequestModel,
  AnimalSummaryModel,
  AnimalUpdateRequestModel,
} from '../models/animal';
import { PaginatedResponseModel } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class AnimalService {
  private readonly apiClient = inject(ApiClientService);

  listar(filtro: AnimalFilterModel): Observable<PaginatedResponseModel<AnimalSummaryModel>> {
    const params: Record<string, unknown> = {};
    if (filtro.estado) params['estado'] = filtro.estado;
    if (filtro.sexo) params['sexo'] = filtro.sexo;
    if (filtro.categoria) params['categoria'] = filtro.categoria;
    if (filtro.buscar) params['buscar'] = filtro.buscar;
    if (filtro.pagina) params['pagina'] = filtro.pagina;
    if (filtro.limite) params['limite'] = filtro.limite;

    return this.apiClient.get<PaginatedResponseModel<AnimalSummaryModel>>(apiEndpoints.ANIMALES.LIST, undefined, {
      params,
    });
  }

  obtener(id: string): Observable<AnimalDetailModel> {
    return this.apiClient.get<AnimalDetailModel>(apiEndpoints.ANIMALES.DETAIL, { id });
  }

  crear(dto: AnimalCreateRequestModel): Observable<AnimalDetailModel> {
    return this.apiClient.post<AnimalDetailModel>(apiEndpoints.ANIMALES.CREATE, dto);
  }

  actualizar(id: string, dto: AnimalUpdateRequestModel): Observable<AnimalDetailModel> {
    return this.apiClient.patch<AnimalDetailModel>(apiEndpoints.ANIMALES.DETAIL, dto, { id });
  }

  registrarPeso(id: string, dto: AnimalPesoRequestModel): Observable<void> {
    return this.apiClient.post<void>(apiEndpoints.ANIMALES.REGISTER_WEIGHT, dto, { id });
  }

  registrarMortalidad(id: string, dto: AnimalMortalidadRequestModel): Observable<void> {
    return this.apiClient.post<void>(apiEndpoints.ANIMALES.REGISTER_MORTALIDAD, dto, { id });
  }
}
