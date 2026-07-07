import { CategoriaGasto, EstadoAprobacion } from '../domain-types';

// Refleja los query params reales de GET /gastos (no hay filtros de fecha).
export interface GastoFilterModel {
  categoria?: CategoriaGasto;
  estadoAprobacion?: EstadoAprobacion;
  soloMisAprobaciones?: boolean;
  pagina?: number;
  limite?: number;
}
