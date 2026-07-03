import { RolUsuario } from '../domain-types';

export interface UsuarioSummaryModel {
  id: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  activo: boolean;
  ultimoAcceso?: string;
}
