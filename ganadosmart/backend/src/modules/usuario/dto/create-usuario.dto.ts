import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { RolUsuario } from '../../../shared/enums/rol-usuario.enum';

export class CrearUsuarioDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail()
  correo: string;

  @IsString()
  @MinLength(8)
  contrasena: string;

  @IsEnum(RolUsuario)
  rol: RolUsuario;
}
