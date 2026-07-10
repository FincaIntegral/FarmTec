import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiEndpoints } from '../api/config/api-endpoints';
import { ApiClientService } from '../api/http/api-client.service';
import { DashboardModel, MortalidadRegistroModel } from '../models/reporte';
import { PaginatedResponseModel } from '../models/pagination.model';

export interface ActividadRegistroModel {
  tipo: string;
  descripcion: string;
  entidadId: string;
  entidadCodigo: string;
  usuario: { id: string; nombre: string; rol: string } | null;
  fecha: string;
}

export interface TransaccionModel {
  tipo: 'venta' | 'gasto';
  fecha: string;
  monto: number;
  estado: string;
}

export interface IngresosVsGastosModel {
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  transacciones: TransaccionModel[];
}

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly apiClient = inject(ApiClientService);

  dashboard(): Observable<DashboardModel> {
    return this.apiClient.get<DashboardModel>(apiEndpoints.REPORTES.DASHBOARD);
  }

  mortalidad(): Observable<MortalidadRegistroModel[]> {
    return this.apiClient.get<MortalidadRegistroModel[]>(apiEndpoints.REPORTES.MORTALIDAD);
  }

  ingresosVsGastos(fechaInicio?: string, fechaFin?: string): Observable<IngresosVsGastosModel> {
    const params: Record<string, unknown> = {};
    if (fechaInicio) params['fechaInicio'] = fechaInicio;
    if (fechaFin) params['fechaFin'] = fechaFin;
    return this.apiClient.get<IngresosVsGastosModel>(
      apiEndpoints.REPORTES.INGRESOS_VS_GASTOS,
      undefined,
      { params },
    );
  }

  actividad(filtros?: {
    usuarioId?: string;
    tipo?: string;
    fechaInicio?: string;
    fechaFin?: string;
    pagina?: number;
    limite?: number;
  }): Observable<PaginatedResponseModel<ActividadRegistroModel>> {
    const params: Record<string, unknown> = {};
    if (filtros?.usuarioId) params['usuarioId'] = filtros.usuarioId;
    if (filtros?.tipo) params['tipo'] = filtros.tipo;
    if (filtros?.fechaInicio) params['fechaInicio'] = filtros.fechaInicio;
    if (filtros?.fechaFin) params['fechaFin'] = filtros.fechaFin;
    if (filtros?.pagina) params['pagina'] = filtros.pagina;
    if (filtros?.limite) params['limite'] = filtros.limite;

    return this.apiClient.get<PaginatedResponseModel<ActividadRegistroModel>>(
      apiEndpoints.REPORTES.ACTIVIDAD,
      undefined,
      { params },
    );
  }
}
