import { CategoriaAnimal, EstadoAnimal, SexoAnimal } from '../domain-types';

// Refleja los query params reales de GET /animales.
export interface AnimalFilterModel {
  estado?: EstadoAnimal;
  sexo?: SexoAnimal;
  categoria?: CategoriaAnimal;
  potreroId?: string;
  buscar?: string;
  pagina?: number;
  limite?: number;
}
