import { CategoriaAnimal, EstadoAnimal, SexoAnimal } from '../domain-types';

export interface AnimalFilterModel {
  search?: string;
  id?: string;
  fincaId?: string;
  madreId?: string;
  padreId?: string;
  identificador?: string;
  categoria?: CategoriaAnimal;
  sexo?: SexoAnimal;
  estado?: EstadoAnimal;
}
