import { RolUsuario } from '../domain-types';

export interface UsuarioFilterModel {
  search?: string;
  id?: string;
  fincaId?: string;
  nombre?: string;
  correo?: string;
  rol?: RolUsuario;
  activo?: boolean;
}
