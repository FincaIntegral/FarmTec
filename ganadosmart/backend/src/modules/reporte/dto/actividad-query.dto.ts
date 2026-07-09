import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsDateString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

// Los 13 tipos que emite el timeline de actividad (ver reporte.repository.ts).
export const TIPOS_ACTIVIDAD = [
  'animal_creado',
  'peso_registrado',
  'mortalidad_registrada',
  'reproduccion_registrada',
  'parto_confirmado',
  'potrero_creado',
  'movimiento_registrado',
  'venta_creada',
  'venta_aprobada',
  'venta_rechazada',
  'gasto_creado',
  'gasto_aprobado',
  'gasto_rechazado',
] as const;

export type TipoActividad = (typeof TIPOS_ACTIVIDAD)[number];

export class ActividadQueryDto {
  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @IsOptional()
  @IsIn(TIPOS_ACTIVIDAD)
  tipo?: TipoActividad;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite: number = 50;
}
