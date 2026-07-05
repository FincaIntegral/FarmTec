import { EstadoAprobacion } from '../enums/estado-aprobacion.enum';
import { TipoAprobacion } from '../enums/tipo-aprobacion.enum';
import { ConfiguracionAprobacion } from '../../modules/configuracion/entities/configuracion-aprobacion.entity';

export interface ResultadoAprobacion {
  estadoAprobacion: EstadoAprobacion;
  tipoAprobacion: TipoAprobacion;
  autoAprobado: boolean;
}

// Regla de negocio central (CLAUDE.md): la auto-aprobación se decide SIEMPRE
// desde configuracion_aprobacion, nunca con umbrales hardcodeados.
// monto < umbral → aprobado por_monto con marca permanente auto_aprobado.
export function evaluarAutoAprobacionPorMonto(
  monto: number,
  aplica: boolean,
  config: ConfiguracionAprobacion,
): ResultadoAprobacion {
  if (aplica && config.montoUmbralAuto !== null && monto < config.montoUmbralAuto) {
    return {
      estadoAprobacion: EstadoAprobacion.APROBADO,
      tipoAprobacion: TipoAprobacion.POR_MONTO,
      autoAprobado: true,
    };
  }
  return {
    estadoAprobacion: EstadoAprobacion.PENDIENTE,
    tipoAprobacion: TipoAprobacion.PENDIENTE,
    autoAprobado: false,
  };
}
