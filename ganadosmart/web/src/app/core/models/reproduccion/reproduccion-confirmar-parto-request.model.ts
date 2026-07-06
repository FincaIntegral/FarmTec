import { SexoAnimal } from '../domain-types';

export interface BecerroRequestModel {
  sexo: SexoAnimal;
  codigo: string;
  pesoNacimiento?: number;
  fechaNacimiento?: string;
}

export interface ReproduccionConfirmarPartoRequestModel {
  resultado: 'exitoso' | 'fallido';
  becerro?: BecerroRequestModel;
}
