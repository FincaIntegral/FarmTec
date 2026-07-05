import { EstadoPotrero } from '../../../shared/enums/estado-potrero.enum';
import { MovimientoGanado } from '../entities/movimiento-ganado.entity';
import { Potrero } from '../entities/potrero.entity';

export class PotreroResponse {
  id: string;
  fincaId: string;
  nombre: string;
  hectareas: number | null;
  tipoPasto: string | null;
  capacidadEstimada: number | null;
  estado: EstadoPotrero;

  static build(potrero: Potrero): PotreroResponse {
    const response = new PotreroResponse();
    response.id = potrero.id;
    response.fincaId = potrero.fincaId;
    response.nombre = potrero.nombre;
    response.hectareas = potrero.hectareas;
    response.tipoPasto = potrero.tipoPasto;
    response.capacidadEstimada = potrero.capacidadEstimada;
    response.estado = potrero.estado;
    return response;
  }
}

export class MovimientoResponse {
  id: string;
  animalId: string;
  potreroOrigenId: string;
  potreroDestinoId: string;
  fecha: string;
  observacion: string | null;

  static build(movimiento: MovimientoGanado): MovimientoResponse {
    const response = new MovimientoResponse();
    response.id = movimiento.id;
    response.animalId = movimiento.animalId;
    response.potreroOrigenId = movimiento.potreroOrigenId;
    response.potreroDestinoId = movimiento.potreroDestinoId;
    response.fecha = movimiento.fecha;
    response.observacion = movimiento.observacion;
    return response;
  }
}
