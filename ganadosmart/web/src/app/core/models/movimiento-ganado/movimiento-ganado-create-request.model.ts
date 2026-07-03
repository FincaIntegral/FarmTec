export interface MovimientoGanadoCreateRequestModel {
  fincaId: string;
  potreroOrigenId: string;
  potreroDestinoId: string;
  animalId: string;
  fecha: string;
  observacion?: string;
  registradoPor?: string;
}
