import { EstadoPotrero } from '../domain-types';

export interface PotreroSummaryModel {
  id: string;
  nombre: string;
  fincaId: string;
  hectareas?: number;
  estado: EstadoPotrero;
}
