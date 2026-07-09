import { CategoriaAnimal, EstadoAnimal, SexoAnimal } from '../domain-types';

// Refleja AnimalResponse — lo que devuelve GET /animales/{id}, POST y PATCH /animales.
export interface AnimalModel {
  id: string;
  codigo: string;
  categoria: CategoriaAnimal;
  sexo: SexoAnimal;
  estado: EstadoAnimal;
  raza: string | null;
  pesoActual: number | null;
  potreroActualId: string | null;
  enGestacion: boolean;
  madreId: string | null;
  padreId: string | null;
  fechaNacimiento: string | null;
  valorComercialEstimado: number | null;
  valorComercialAjustado: number | null;
  fotoUrl: string | null;
  createdAt: string;
  historialPeso: { pesoKg: number; fecha: string }[];
  conteoReproduccion: { inseminaciones: number; servicios: number };
}
