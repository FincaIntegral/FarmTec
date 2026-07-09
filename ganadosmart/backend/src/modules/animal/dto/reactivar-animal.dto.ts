import { IsNotEmpty, IsString } from 'class-validator';

export class ReactivarAnimalDto {
  @IsString()
  @IsNotEmpty()
  motivo: string;
}
