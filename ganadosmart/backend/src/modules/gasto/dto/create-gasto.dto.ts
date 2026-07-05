import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { CategoriaGasto } from '../../../shared/enums/categoria-gasto.enum';

export class CrearGastoDto {
  @IsEnum(CategoriaGasto)
  categoria: CategoriaGasto;

  @IsNumber()
  @IsPositive()
  monto: number;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsDateString()
  fecha: string;
}
