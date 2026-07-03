import { CategoriaGasto, EstadoAprobacion, TipoAprobacion } from '../domain-types';

export interface GastoUpdateRequestModel {
  id: string;
  fincaId?: string;
  categoria?: CategoriaGasto;
  monto?: number;
  descripcion?: string;
  fecha?: string;
  estadoAprobacion?: EstadoAprobacion;
  tipoAprobacion?: TipoAprobacion;
  autoAprobado?: boolean;
  creadoPor?: string;
  aprobadoPor?: string;
  motivoRechazo?: string;
}
