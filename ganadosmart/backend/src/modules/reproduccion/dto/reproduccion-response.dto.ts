import { EstadoReproduccion } from '../../../shared/enums/estado-reproduccion.enum';
import { TipoReproduccion } from '../../../shared/enums/tipo-reproduccion.enum';
import { Reproduccion } from '../entities/reproduccion.entity';

export class ReproduccionResponse {
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
  createdAt: Date;

  static build(reproduccion: Reproduccion): ReproduccionResponse {
    const response = new ReproduccionResponse();
    response.id = reproduccion.id;
    response.fincaId = reproduccion.fincaId;
    response.toroId = reproduccion.toroId;
    response.pajillaProveedor = reproduccion.pajillaProveedor;
    response.pajillaRaza = reproduccion.pajillaRaza;
    response.vacaId = reproduccion.vacaId;
    response.tipo = reproduccion.tipo;
    response.fecha = reproduccion.fecha;
    response.fechaProbableParto = reproduccion.fechaProbableParto;
    response.estado = reproduccion.estado;
    response.becerroResultanteId = reproduccion.becerroResultanteId;
    response.createdAt = reproduccion.createdAt;
    return response;
  }
}
