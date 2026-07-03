import { CategoriaAnimal, EstadoAnimal, SexoAnimal } from '../domain-types';

export interface AnimalUpdateRequestModel {
  id: string;
  fincaId?: string;
  madreId?: string;
  padreId?: string;
  identificador?: string;
  categoria?: CategoriaAnimal;
  sexo?: SexoAnimal;
  fechaNacimiento?: string;
  raza?: string;
  valorComercialEstimado?: number;
  valorComercialAjustado?: number;
  fotoUrl?: string;
  estado?: EstadoAnimal;
}
