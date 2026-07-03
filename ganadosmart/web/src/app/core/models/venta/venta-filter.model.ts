import { EstadoAprobacion, TipoAprobacion } from '../domain-types';

export interface VentaFilterModel {
  search?: string;
  id?: string;
  fincaId?: string;
  animalId?: string;
  comprador?: string;
  estadoAprobacion?: EstadoAprobacion;
  tipoAprobacion?: TipoAprobacion;
}
