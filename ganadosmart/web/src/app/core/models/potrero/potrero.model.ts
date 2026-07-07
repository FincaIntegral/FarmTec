import { EstadoPotrero } from '../domain-types';

export interface PotreroModel {
  id: string;
  fincaId: string;
  nombre: string;
  hectareas: number | null;
  tipoPasto: string | null;
  capacidadEstimada: number | null;
  estado: EstadoPotrero;
}
