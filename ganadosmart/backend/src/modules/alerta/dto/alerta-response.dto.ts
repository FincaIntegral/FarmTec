import { SeveridadAlerta } from '../../../shared/enums/severidad-alerta.enum';
import { TipoOrigenAlerta } from '../../../shared/enums/tipo-origen-alerta.enum';
import { Alerta } from '../entities/alerta.entity';

export class AlertaResponse {
  id: string;
  fincaId: string;
  referenciaId: string;
  tipoOrigen: TipoOrigenAlerta;
  mensaje: string;
  severidad: SeveridadAlerta;
  leida: boolean;
  fecha: Date;

  static build(alerta: Alerta): AlertaResponse {
    const response = new AlertaResponse();
    response.id = alerta.id;
    response.fincaId = alerta.fincaId;
    response.referenciaId = alerta.referenciaId;
    response.tipoOrigen = alerta.tipoOrigen;
    response.mensaje = alerta.mensaje;
    response.severidad = alerta.severidad;
    response.leida = alerta.leida;
    response.fecha = alerta.fecha;
    return response;
  }
}
