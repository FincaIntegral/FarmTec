import { EstadoAprobacion } from '../domain-types';

export interface VentaSummaryModel {
  id: string;
  comprador: string;
  monto: number;
  fecha: string;
  estadoAprobacion: EstadoAprobacion;
  autoAprobado: boolean;
}
