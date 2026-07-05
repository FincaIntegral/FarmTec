import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CrearPotreroDto {
  @IsString()
  @MaxLength(150)
  nombre: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  hectareas?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  tipoPasto?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  capacidadEstimada?: number;
}
