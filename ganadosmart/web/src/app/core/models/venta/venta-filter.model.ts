import { EstadoAprobacion } from '../domain-types';

// Refleja los query params reales de GET /ventas.
export interface VentaFilterModel {
  estadoAprobacion?: EstadoAprobacion;
  soloMisAprobaciones?: boolean;
  fechaInicio?: string;
  fechaFin?: string;
  pagina?: number;
  limite?: number;
}
