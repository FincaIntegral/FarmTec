import { ConfiguracionAprobacion } from '../entities/configuracion-aprobacion.entity';

export class ConfiguracionAprobacionResponse {
  id: string;
  fincaId: string;
  montoUmbralAuto: number | null;
  diasEsperaAprobacion: number | null;
  aplicaAVentas: boolean;
  aplicaAGastos: boolean;
  updatedAt: Date;

  static build(config: ConfiguracionAprobacion): ConfiguracionAprobacionResponse {
    const response = new ConfiguracionAprobacionResponse();
    response.id = config.id;
    response.fincaId = config.fincaId;
    response.montoUmbralAuto = config.montoUmbralAuto;
    response.diasEsperaAprobacion = config.diasEsperaAprobacion;
    response.aplicaAVentas = config.aplicaAVentas;
    response.aplicaAGastos = config.aplicaAGastos;
    response.updatedAt = config.updatedAt;
    return response;
  }
}
