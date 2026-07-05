import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CategoriaAnimal } from '../../../shared/enums/categoria-animal.enum';
import { EstadoAnimal } from '../../../shared/enums/estado-animal.enum';
import { SexoAnimal } from '../../../shared/enums/sexo-animal.enum';
import { PaginacionQueryDto } from '../../../shared/dto/paginacion-query.dto';

export class ListarAnimalesQueryDto extends PaginacionQueryDto {
  @IsOptional()
  @IsEnum(EstadoAnimal)
  estado?: EstadoAnimal;

  @IsOptional()
  @IsEnum(SexoAnimal)
  sexo?: SexoAnimal;

  @IsOptional()
  @IsEnum(CategoriaAnimal)
  categoria?: CategoriaAnimal;

  // Animales cuyo último movimiento terminó en este potrero
  @IsOptional()
  @IsUUID()
  potreroId?: string;

  @IsOptional()
  @IsString()
  buscar?: string;
}
