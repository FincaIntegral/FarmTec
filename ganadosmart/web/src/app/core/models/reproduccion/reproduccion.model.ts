import { EstadoReproduccion, TipoReproduccion } from '../domain-types';

export interface ReproduccionModel {
  id: string;
  fincaId: string;
  toroId: string | null;
  pajillaProveedor: string | null;
  pajillaRaza: string | null;
  vacaId: string;
  tipo: TipoReproduccion;
  fecha: string;
  fechaProbableParto: string | null;
  estado: EstadoReproduccion;
  becerroResultanteId: string | null;
  createdAt: string;
}
