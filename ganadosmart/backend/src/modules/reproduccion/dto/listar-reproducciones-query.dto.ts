import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginacionQueryDto } from '../../../shared/dto/paginacion-query.dto';
import { EstadoReproduccion } from '../../../shared/enums/estado-reproduccion.enum';

export class ListarReproduccionesQueryDto extends PaginacionQueryDto {
  @IsOptional()
  @IsEnum(EstadoReproduccion)
  estado?: EstadoReproduccion;

  @IsOptional()
  @IsUUID()
  vacaId?: string;
}
