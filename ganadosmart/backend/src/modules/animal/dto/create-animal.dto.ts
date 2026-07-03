import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { CategoriaAnimal } from '../../../shared/enums/categoria-animal.enum';
import { SexoAnimal } from '../../../shared/enums/sexo-animal.enum';

export class CrearAnimalDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsEnum(CategoriaAnimal)
  categoria: CategoriaAnimal;

  @IsEnum(SexoAnimal)
  sexo: SexoAnimal;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @IsOptional()
  @IsString()
  raza?: string;

  @IsOptional()
  @IsUUID()
  madreId?: string;

  @IsOptional()
  @IsUUID()
  padreId?: string;
}
