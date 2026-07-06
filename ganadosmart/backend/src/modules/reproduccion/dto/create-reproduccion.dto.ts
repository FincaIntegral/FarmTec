import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TipoReproduccion } from '../../../shared/enums/tipo-reproduccion.enum';

export class CrearReproduccionDto {
  // Requerido para monta_natural. Para inseminacion es una de dos opciones
  // (toroId propio O pajillaProveedor+pajillaRaza) — validado en el service,
  // no aquí, porque depende del valor de `tipo`.
  @IsOptional()
  @IsUUID()
  toroId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  pajillaProveedor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  pajillaRaza?: string;

  @IsUUID()
  vacaId: string;

  @IsEnum(TipoReproduccion)
  tipo: TipoReproduccion;

  @IsDateString()
  fecha: string;
}
