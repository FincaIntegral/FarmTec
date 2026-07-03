import { JsonObject, EstadoSync, TipoAccionSync } from '../domain-types';

export interface AccionSyncModel {
  id: string;
  fincaId: string;
  usuarioId: string;
  tipoAccion: TipoAccionSync;
  timestampLocal: string;
  versionBase?: string;
  datos: JsonObject;
  estadoSync: EstadoSync;
  detalleConflicto?: JsonObject;
  procesadoEn?: string;
}
