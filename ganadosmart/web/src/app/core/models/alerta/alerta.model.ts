import { SeveridadAlerta, TipoOrigenAlerta } from '../domain-types';

export interface AlertaModel {
  id: string;
  fincaId: string;
  referenciaId: string;
  tipoOrigen: TipoOrigenAlerta;
  mensaje: string;
  severidad: SeveridadAlerta;
  leida: boolean;
  fecha: string;
}
