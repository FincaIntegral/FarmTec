import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { SexoAnimal } from '../../../shared/enums/sexo-animal.enum';

export class BecerroDto {
  @IsEnum(SexoAnimal)
  sexo: SexoAnimal;

  @IsString()
  codigo: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  pesoNacimiento?: number;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;
}

export class ConfirmarPartoDto {
  @IsIn(['exitoso', 'fallido'])
  resultado: 'exitoso' | 'fallido';

  @IsOptional()
  @ValidateNested()
  @Type(() => BecerroDto)
  becerro?: BecerroDto;
}
