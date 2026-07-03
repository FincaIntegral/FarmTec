export interface ConfiguracionAprobacionUpdateRequestModel {
  id: string;
  fincaId?: string;
  montoUmbralAuto?: number;
  diasEsperaAprobacion?: number;
  aplicaAVentas?: boolean;
  aplicaAGastos?: boolean;
  configuradoPor?: string;
}
