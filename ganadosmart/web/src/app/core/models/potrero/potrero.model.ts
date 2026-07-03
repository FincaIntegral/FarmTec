import { EstadoPotrero } from '../domain-types';

export interface PotreroModel {
  id: string;
  fincaId: string;
  nombre: string;
  hectareas?: number;
  tipoPasto?: string;
  capacidadEstimada?: number;
  estado: EstadoPotrero;
  createdAt: string;
}
