export interface MovimientoGanadoModel {
  id: string;
  fincaId: string;
  potreroOrigenId: string;
  potreroDestinoId: string;
  animalId: string;
  fecha: string;
  observacion?: string;
  registradoPor?: string;
  createdAt: string;
}
