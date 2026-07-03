import { EstadoReproduccion, TipoReproduccion } from '../domain-types';

export interface ReproduccionUpdateRequestModel {
  id: string;
  fincaId?: string;
  toroId?: string;
  vacaId?: string;
  tipo?: TipoReproduccion;
  fecha?: string;
  fechaProbableParto?: string;
  estado?: EstadoReproduccion;
  becerroResultanteId?: string;
}
