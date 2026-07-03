import { CategoriaAnimal, EstadoAnimal, SexoAnimal } from '../domain-types';

export interface AnimalModel {
  id: string;
  fincaId: string;
  madreId?: string;
  padreId?: string;
  identificador: string;
  categoria: CategoriaAnimal;
  sexo: SexoAnimal;
  fechaNacimiento?: string;
  raza?: string;
  valorComercialEstimado?: number;
  valorComercialAjustado?: number;
  fotoUrl?: string;
  estado: EstadoAnimal;
  createdAt: string;
}
