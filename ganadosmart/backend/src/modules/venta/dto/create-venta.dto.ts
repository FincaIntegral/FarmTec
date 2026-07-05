import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CrearVentaDto {
  @IsOptional()
  @IsUUID()
  animalId?: string;

  @IsString()
  @MaxLength(300)
  comprador: string;

  @IsNumber()
  @IsPositive()
  monto: number;

  @IsDateString()
  fecha: string;
}
