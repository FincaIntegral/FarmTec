import { Animal } from '../entities/animal.entity';
import { HistorialPeso } from '../entities/historial-peso.entity';
import { AnimalListItemResponse } from './animal-list-item.dto';

export class AnimalResponse extends AnimalListItemResponse {
  madreId: string | null;
  padreId: string | null;
  fechaNacimiento: string | null;
  valorComercialEstimado: number | null;
  valorComercialAjustado: number | null;
  fotoUrl: string | null;
  createdAt: Date;
  historialPeso: { pesoKg: number; fecha: string }[];
  conteoReproduccion: { inseminaciones: number; servicios: number };

  static buildDetalle(
    animal: Animal,
    pesoActual: number | null,
    historialPeso: HistorialPeso[],
  ): AnimalResponse {
    const response = new AnimalResponse();
    const base = AnimalListItemResponse.build(animal, pesoActual);
    response.id = base.id;
    response.codigo = base.codigo;
    response.categoria = base.categoria;
    response.sexo = base.sexo;
    response.estado = base.estado;
    response.raza = base.raza;
    response.pesoActual = base.pesoActual;
    response.potreroActualId = base.potreroActualId;
    response.enGestacion = base.enGestacion;

    response.madreId = animal.madreId;
    response.padreId = animal.padreId;
    response.fechaNacimiento = animal.fechaNacimiento;
    response.valorComercialEstimado = animal.valorComercialEstimado;
    response.valorComercialAjustado = animal.valorComercialAjustado;
    response.fotoUrl = animal.fotoUrl;
    response.createdAt = animal.createdAt;
    response.historialPeso = historialPeso.map((h) => ({
      pesoKg: h.pesoKg,
      fecha: h.fecha,
    }));
    // TODO: poblar cuando ReproduccionModule exista e importe en AnimalModule
    response.conteoReproduccion = { inseminaciones: 0, servicios: 0 };

    return response;
  }
}
