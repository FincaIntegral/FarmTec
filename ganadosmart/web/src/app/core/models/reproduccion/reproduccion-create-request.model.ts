import { TipoReproduccion } from '../domain-types';

export interface ReproduccionCreateRequestModel {
  toroId?: string;
  pajillaProveedor?: string;
  pajillaRaza?: string;
  vacaId: string;
  tipo: TipoReproduccion;
  fecha: string;
}
