import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CrearMovimientoDto {
  @IsUUID()
  animalId: string;

  @IsUUID()
  potreroOrigenId: string;

  @IsUUID()
  potreroDestinoId: string;

  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsString()
  observacion?: string;
}
