import { IsDateString, IsEnum, IsUUID } from 'class-validator';
import { TipoReproduccion } from '../../../shared/enums/tipo-reproduccion.enum';

export class CrearReproduccionDto {
  @IsUUID()
  toroId: string;

  @IsUUID()
  vacaId: string;

  @IsEnum(TipoReproduccion)
  tipo: TipoReproduccion;

  @IsDateString()
  fecha: string;
}
