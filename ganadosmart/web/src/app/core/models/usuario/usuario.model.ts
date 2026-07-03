import { RolUsuario } from '../domain-types';

export interface UsuarioModel {
  id: string;
  fincaId: string;
  nombre: string;
  correo: string;
  contrasenaHash: string;
  rol: RolUsuario;
  activo: boolean;
  ultimoAcceso?: string;
  createdAt: string;
}
