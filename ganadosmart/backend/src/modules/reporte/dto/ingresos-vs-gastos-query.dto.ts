import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { CategoriaGasto } from '../../../shared/enums/categoria-gasto.enum';

export class IngresosVsGastosQueryDto {
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsEnum(CategoriaGasto)
  categoria?: CategoriaGasto;
}
