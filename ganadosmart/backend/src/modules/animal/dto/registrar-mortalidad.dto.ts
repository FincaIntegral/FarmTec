import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class RegistrarMortalidadDto {
  @IsDateString()
  fecha: string;

  @IsString()
  @IsNotEmpty()
  causa: string;
}
