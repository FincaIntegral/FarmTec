import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiEndpoints } from '../api/config/api-endpoints';
import { ApiClientService } from '../api/http/api-client.service';
import { PaginatedResponseModel } from '../models/pagination.model';
import {
  UsuarioCreateRequestModel,
  UsuarioDetailModel,
  UsuarioFilterModel,
} from '../models/usuario';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly apiClient = inject(ApiClientService);

  listar(filtro: UsuarioFilterModel = {}): Observable<PaginatedResponseModel<UsuarioDetailModel>> {
    const params: Record<string, unknown> = {};
    if (filtro.pagina) params['pagina'] = filtro.pagina;
    if (filtro.limite) params['limite'] = filtro.limite;

    return this.apiClient.get<PaginatedResponseModel<UsuarioDetailModel>>(apiEndpoints.USUARIOS.LIST, undefined, {
      params,
    });
  }

  crear(dto: UsuarioCreateRequestModel): Observable<UsuarioDetailModel> {
    return this.apiClient.post<UsuarioDetailModel>(apiEndpoints.USUARIOS.CREATE, dto);
  }

  cambiarContrasena(
    usuarioId: string,
    dto: { nuevaContrasena: string },
  ): Observable<UsuarioDetailModel> {
    return this.apiClient.patch<UsuarioDetailModel>(
      apiEndpoints.USUARIOS.CAMBIAR_PASSWORD(usuarioId),
      dto,
    );
  }

  desactivar(usuarioId: string): Observable<UsuarioDetailModel> {
    return this.apiClient.patch<UsuarioDetailModel>(
      apiEndpoints.USUARIOS.DESACTIVAR(usuarioId),
      {},
    );
  }

  reactivar(usuarioId: string): Observable<UsuarioDetailModel> {
    return this.apiClient.patch<UsuarioDetailModel>(
      apiEndpoints.USUARIOS.REACTIVAR(usuarioId),
      {},
    );
  }
}
