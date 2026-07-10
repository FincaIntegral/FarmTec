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
  historialPeso: { pesoKg: number; fecha: string }[];
  conteoReproduccion: { inseminaciones: number; servicios: number };

  static buildDetalle(
    animal: Animal,
    pesoActual: number | null,
    historialPeso: HistorialPeso[],
    enGestacion = false,
    conteoReproduccion = { inseminaciones: 0, servicios: 0 },
    potreroActualId: string | null = null,
  ): AnimalResponse {
    const response = new AnimalResponse();
    const base = AnimalListItemResponse.build(
      animal,
      pesoActual,
      enGestacion,
      potreroActualId,
    );
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
    response.createdAt = animal.createdAt.toISOString();
    response.historialPeso = historialPeso.map((h) => ({
      pesoKg: h.pesoKg,
      fecha: h.fecha,
    }));
    response.conteoReproduccion = conteoReproduccion;

    return response;
  }
}
