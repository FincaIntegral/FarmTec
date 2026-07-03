import { CategoriaGasto, EstadoAprobacion, TipoAprobacion } from '../domain-types';

export interface GastoFilterModel {
  search?: string;
  id?: string;
  fincaId?: string;
  categoria?: CategoriaGasto;
  estadoAprobacion?: EstadoAprobacion;
  tipoAprobacion?: TipoAprobacion;
}
