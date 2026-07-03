import { IsNotEmpty, IsString } from 'class-validator';

export class ActualizarFotoDto {
  @IsString()
  @IsNotEmpty()
  fotoUrl: string;
}
