import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaginacionQueryDto } from '../../../shared/dto/paginacion-query.dto';
import { CategoriaGasto } from '../../../shared/enums/categoria-gasto.enum';
import { EstadoAprobacion } from '../../../shared/enums/estado-aprobacion.enum';

export class ListarGastosQueryDto extends PaginacionQueryDto {
  @IsOptional()
  @IsEnum(CategoriaGasto)
  categoria?: CategoriaGasto;

  @IsOptional()
  @IsEnum(EstadoAprobacion)
  estadoAprobacion?: EstadoAprobacion;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  soloMisAprobaciones?: boolean;
}
