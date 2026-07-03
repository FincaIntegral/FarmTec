import { CategoriaAnimal, EstadoAnimal, SexoAnimal } from '../domain-types';

export interface AnimalSummaryModel {
  id: string;
  identificador: string;
  categoria: CategoriaAnimal;
  sexo: SexoAnimal;
  estado: EstadoAnimal;
  fincaId: string;
  createdAt: string;
}
