import { SeveridadAlerta, TipoOrigenAlerta } from '../domain-types';

export interface AlertaSummaryModel {
  id: string;
  tipoOrigen: TipoOrigenAlerta;
  mensaje: string;
  severidad: SeveridadAlerta;
  leida: boolean;
  fecha: string;
}
