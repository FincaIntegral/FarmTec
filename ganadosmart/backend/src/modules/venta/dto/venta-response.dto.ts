import { EstadoAprobacion } from '../../../shared/enums/estado-aprobacion.enum';
import { TipoAprobacion } from '../../../shared/enums/tipo-aprobacion.enum';
import { Venta } from '../entities/venta.entity';

export class VentaResponse {
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
  createdAt: Date;

  static build(venta: Venta): VentaResponse {
    const response = new VentaResponse();
    response.id = venta.id;
    response.fincaId = venta.fincaId;
    response.animalId = venta.animalId;
    response.comprador = venta.comprador;
    response.monto = venta.monto;
    response.fecha = venta.fecha;
    response.estadoAprobacion = venta.estadoAprobacion;
    response.tipoAprobacion = venta.tipoAprobacion;
    response.autoAprobado = venta.autoAprobado;
    response.creadoPor = venta.creadoPor;
    response.aprobadoPor = venta.aprobadoPor;
    response.motivoRechazo = venta.motivoRechazo;
    response.createdAt = venta.createdAt;
    return response;
  }
}
