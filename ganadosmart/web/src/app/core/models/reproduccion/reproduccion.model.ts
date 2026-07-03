import { EstadoReproduccion, TipoReproduccion } from '../domain-types';

export interface ReproduccionModel {
  id: string;
  fincaId: string;
  toroId: string;
  vacaId: string;
  tipo: TipoReproduccion;
  fecha: string;
  fechaProbableParto?: string;
  estado: EstadoReproduccion;
  becerroResultanteId?: string;
  createdAt: string;
}
