import { CategoriaAnimal, SexoAnimal } from '../domain-types';

// PATCH /animales/{id} recibe el mismo shape que CrearAnimalDto (reemplazo
// completo, no parcial) — el backend no soporta actualización parcial.
export interface AnimalUpdateRequestModel {
  codigo: string;
  categoria: CategoriaAnimal;
  sexo: SexoAnimal;
  fechaNacimiento?: string;
  raza?: string;
  madreId?: string;
  padreId?: string;
}
