import { EstadoReproduccion, TipoReproduccion } from '../domain-types';

export interface ReproduccionFilterModel {
  search?: string;
  id?: string;
  fincaId?: string;
  toroId?: string;
  vacaId?: string;
  tipo?: TipoReproduccion;
  estado?: EstadoReproduccion;
}
