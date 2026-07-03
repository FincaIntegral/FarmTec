export interface MortalidadCreateRequestModel {
  animalId: string;
  fincaId: string;
  fecha: string;
  causa: string;
  registradoPor?: string;
}
