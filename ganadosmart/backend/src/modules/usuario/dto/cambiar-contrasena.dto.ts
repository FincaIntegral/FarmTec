import { MinLength, IsString } from 'class-validator';

export class CambiarContrasenaDto {
  @IsString()
  @MinLength(8, {
    message: 'La contraseña debe tener al menos 8 caracteres',
  })
  nuevaContrasena: string;
}
