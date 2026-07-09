import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { PaginacionQueryDto } from '../../../shared/dto/paginacion-query.dto';
import { EstadoAprobacion } from '../../../shared/enums/estado-aprobacion.enum';

export class ListarVentasQueryDto extends PaginacionQueryDto {
  @IsOptional()
  @IsEnum(EstadoAprobacion)
  estadoAprobacion?: EstadoAprobacion;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  soloMisAprobaciones?: boolean;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}
