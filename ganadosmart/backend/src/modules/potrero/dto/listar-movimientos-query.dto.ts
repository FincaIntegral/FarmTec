import { IsOptional, IsUUID } from 'class-validator';
import { PaginacionQueryDto } from '../../../shared/dto/paginacion-query.dto';

export class ListarMovimientosQueryDto extends PaginacionQueryDto {
  @IsOptional()
  @IsUUID()
  animalId?: string;

  // Filtra movimientos donde el potrero fue origen O destino
  @IsOptional()
  @IsUUID()
  potreroId?: string;
}
