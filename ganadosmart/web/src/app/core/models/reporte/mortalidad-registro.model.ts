import { CategoriaAnimal } from '../domain-types';

// Un registro por animal muerto — GET /reportes/mortalidad.
export interface MortalidadRegistroModel {
  animalId: string;
  codigo: string;
  categoria: CategoriaAnimal;
  fecha: string;
  causa: string;
}
