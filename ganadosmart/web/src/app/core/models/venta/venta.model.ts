import { EstadoAprobacion, TipoAprobacion } from '../domain-types';

export interface VentaModel {
  id: string;
  fincaId: string;
  animalId: string | null;
  comprador: string;
  monto: number;
  fecha: string;
  estadoAprobacion: EstadoAprobacion;
  tipoAprobacion: TipoAprobacion;
  autoAprobado: boolean;
  creadoPor: string;
  aprobadoPor: string | null;
  motivoRechazo: string | null;
  createdAt: string;
}
