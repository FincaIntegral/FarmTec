import { CategoriaAnimal, SexoAnimal } from '../domain-types';

// Refleja CrearAnimalDto exacto — sin fincaId (nunca del cliente, va del JWT)
// ni campos que el backend no acepta en este endpoint (estado, valorComercial*, fotoUrl).
export interface AnimalCreateRequestModel {
  codigo: string;
  categoria: CategoriaAnimal;
  sexo: SexoAnimal;
  fechaNacimiento?: string;
  raza?: string;
  madreId?: string;
  padreId?: string;
}
