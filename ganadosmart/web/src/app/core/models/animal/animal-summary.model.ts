import { CategoriaAnimal, EstadoAnimal, SexoAnimal } from '../domain-types';

// Refleja AnimalListItemResponse — lo que devuelve GET /animales.
export interface AnimalSummaryModel {
  id: string;
  codigo: string;
  categoria: CategoriaAnimal;
  sexo: SexoAnimal;
  estado: EstadoAnimal;
  raza: string | null;
  pesoActual: number | null;
  potreroActualId: string | null;
  enGestacion: boolean;
}
