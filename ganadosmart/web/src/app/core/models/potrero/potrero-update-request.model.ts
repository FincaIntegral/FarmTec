import { EstadoPotrero } from '../domain-types';

export interface PotreroUpdateRequestModel {
  id: string;
  fincaId?: string;
  nombre?: string;
  hectareas?: number;
  tipoPasto?: string;
  capacidadEstimada?: number;
  estado?: EstadoPotrero;
}
