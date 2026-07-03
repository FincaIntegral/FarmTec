import { RolUsuario } from '../../../shared/enums/rol-usuario.enum';
import { Usuario } from '../entities/usuario.entity';

export class UsuarioResponse {
  id: string;
  fincaId: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  activo: boolean;
  ultimoAcceso: Date | null;
  createdAt: Date;

  static fromEntity(usuario: Usuario): UsuarioResponse {
    const response = new UsuarioResponse();
    response.id = usuario.id;
    response.fincaId = usuario.fincaId;
    response.nombre = usuario.nombre;
    response.correo = usuario.correo;
    response.rol = usuario.rol;
    response.activo = usuario.activo;
    response.ultimoAcceso = usuario.ultimoAcceso;
    response.createdAt = usuario.createdAt;
    return response;
  }
}
