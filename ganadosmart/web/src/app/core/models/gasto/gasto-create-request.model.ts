import { CategoriaGasto } from '../domain-types';

// Refleja CrearGastoDto: el resto (fincaId, estados, creadoPor) es server-side.
export interface GastoCreateRequestModel {
  categoria: CategoriaGasto;
  monto: number;
  descripcion?: string;
  fecha: string;
}
