import { EstadoPotrero } from '../domain-types';

export interface PotreroCreateRequestModel {
  fincaId: string;
  nombre: string;
  hectareas?: number;
  tipoPasto?: string;
  capacidadEstimada?: number;
  estado?: EstadoPotrero;
}
