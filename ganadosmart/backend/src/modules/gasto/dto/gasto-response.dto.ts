import { CategoriaGasto } from '../../../shared/enums/categoria-gasto.enum';
import { EstadoAprobacion } from '../../../shared/enums/estado-aprobacion.enum';
import { TipoAprobacion } from '../../../shared/enums/tipo-aprobacion.enum';
import { Gasto } from '../entities/gasto.entity';

export class GastoResponse {
  id: string;
  fincaId: string;
  categoria: CategoriaGasto;
  monto: number;
  descripcion: string | null;
  fecha: string;
  estadoAprobacion: EstadoAprobacion;
  tipoAprobacion: TipoAprobacion;
  autoAprobado: boolean;
  creadoPor: string;
  aprobadoPor: string | null;
  motivoRechazo: string | null;
  createdAt: Date;

  static build(gasto: Gasto): GastoResponse {
    const response = new GastoResponse();
    response.id = gasto.id;
    response.fincaId = gasto.fincaId;
    response.categoria = gasto.categoria;
    response.monto = gasto.monto;
    response.descripcion = gasto.descripcion;
    response.fecha = gasto.fecha;
    response.estadoAprobacion = gasto.estadoAprobacion;
    response.tipoAprobacion = gasto.tipoAprobacion;
    response.autoAprobado = gasto.autoAprobado;
    response.creadoPor = gasto.creadoPor;
    response.aprobadoPor = gasto.aprobadoPor;
    response.motivoRechazo = gasto.motivoRechazo;
    response.createdAt = gasto.createdAt;
    return response;
  }
}
