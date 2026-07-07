export interface MovimientoGanadoCreateRequestModel {
  animalId: string;
  potreroOrigenId: string;
  potreroDestinoId: string;
  fecha: string;
  observacion?: string;
}
