import { ValueTransformer } from 'typeorm';

// El driver `pg` devuelve columnas NUMERIC como string para no perder
// precisión — este transformer las convierte a number en el lado de la app.
export const numericTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : parseFloat(value),
};
