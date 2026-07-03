import { CategoriaGasto, EstadoAprobacion } from '../domain-types';

export interface GastoSummaryModel {
  id: string;
  categoria: CategoriaGasto;
  monto: number;
  fecha: string;
  estadoAprobacion: EstadoAprobacion;
  autoAprobado: boolean;
}
