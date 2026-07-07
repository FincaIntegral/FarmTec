import { RolUsuario } from '../domain-types';

// Refleja CrearUsuarioDto: el backend hashea la contraseña y toma fincaId del JWT.
export interface UsuarioCreateRequestModel {
  nombre: string;
  correo: string;
  contrasena: string;
  rol: RolUsuario;
}
