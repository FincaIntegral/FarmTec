import { EstadoReproduccion } from '../domain-types';

// Refleja los query params reales de GET /reproducciones.
export interface ReproduccionFilterModel {
  estado?: EstadoReproduccion;
  vacaId?: string;
  pagina?: number;
  limite?: number;
}
