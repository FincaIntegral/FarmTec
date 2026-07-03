import { EstadoAprobacion, TipoAprobacion } from '../domain-types';

export interface VentaModel {
  id: string;
  fincaId: string;
  animalId?: string;
  comprador: string;
  monto: number;
  fecha: string;
  estadoAprobacion: EstadoAprobacion;
  tipoAprobacion: TipoAprobacion;
  autoAprobado: boolean;
  creadoPor: string;
  aprobadoPor?: string;
  motivoRechazo?: string;
  createdAt: string;
}
