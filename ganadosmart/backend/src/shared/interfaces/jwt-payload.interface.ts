import { RolUsuario } from '../enums/rol-usuario.enum';

export interface JwtPayload {
  sub: string;
  fincaId: string;
  rol: RolUsuario;
}
