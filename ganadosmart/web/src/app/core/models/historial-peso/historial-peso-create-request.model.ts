export interface HistorialPesoCreateRequestModel {
  animalId: string;
  fincaId: string;
  pesoKg: number;
  fecha: string;
  registradoPor?: string;
}
