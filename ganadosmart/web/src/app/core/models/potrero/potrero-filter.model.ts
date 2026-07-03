import { EstadoPotrero } from '../domain-types';

export interface PotreroFilterModel {
  search?: string;
  id?: string;
  fincaId?: string;
  nombre?: string;
  estado?: EstadoPotrero;
}
