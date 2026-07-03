import { CategoriaGasto, EstadoAprobacion, TipoAprobacion } from '../domain-types';

export interface GastoCreateRequestModel {
  fincaId: string;
  categoria: CategoriaGasto;
  monto: number;
  descripcion?: string;
  fecha: string;
  estadoAprobacion?: EstadoAprobacion;
  tipoAprobacion?: TipoAprobacion;
  autoAprobado?: boolean;
  creadoPor: string;
  aprobadoPor?: string;
  motivoRechazo?: string;
}
