import { IsDateString, IsPositive } from 'class-validator';

export class RegistrarPesoDto {
  @IsPositive()
  pesoKg: number;

  @IsDateString()
  fecha: string;
}
