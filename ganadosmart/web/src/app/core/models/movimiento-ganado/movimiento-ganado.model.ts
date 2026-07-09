export interface MovimientoGanadoModel {
  id: string;
  animalId: string;
  potreroOrigenId: string;
  potreroDestinoId: string;
  fecha: string;
  observacion: string | null;
}
