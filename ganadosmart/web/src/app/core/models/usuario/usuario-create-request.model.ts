import { RolUsuario } from '../domain-types';

export interface UsuarioCreateRequestModel {
  fincaId: string;
  nombre: string;
  correo: string;
  contrasenaHash: string;
  rol: RolUsuario;
  activo?: boolean;
  ultimoAcceso?: string;
}
