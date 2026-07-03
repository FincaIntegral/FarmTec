import { CategoriaAnimal } from '../../../shared/enums/categoria-animal.enum';
import { EstadoAnimal } from '../../../shared/enums/estado-animal.enum';
import { SexoAnimal } from '../../../shared/enums/sexo-animal.enum';
import { Animal } from '../entities/animal.entity';

export class AnimalListItemResponse {
  id: string;
  codigo: string;
  categoria: CategoriaAnimal;
  sexo: SexoAnimal;
  estado: EstadoAnimal;
  raza: string | null;
  pesoActual: number | null;
  potreroActualId: string | null;
  enGestacion: boolean;

  static build(
    animal: Animal,
    pesoActual: number | null,
  ): AnimalListItemResponse {
    const response = new AnimalListItemResponse();
    response.id = animal.id;
    response.codigo = animal.codigo;
    response.categoria = animal.categoria;
    response.sexo = animal.sexo;
    response.estado = animal.estado;
    response.raza = animal.raza;
    response.pesoActual = pesoActual;
    // TODO: poblar cuando PotreroModule exista e importe en AnimalModule
    response.potreroActualId = null;
    // TODO: poblar cuando ReproduccionModule exista e importe en AnimalModule
    response.enGestacion = false;
    return response;
  }
}
