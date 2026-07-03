import { ExecutionContext, Injectable, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../shared/decorators/roles.decorator';
import { RolUsuario } from '../../../shared/enums/rol-usuario.enum';
import { JwtPayload } from '../../../shared/interfaces/jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesPermitidos = this.reflector.getAllAndOverride<RolUsuario[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Sin @Roles() en el endpoint: cualquier usuario autenticado pasa.
    if (!rolesPermitidos || rolesPermitidos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();

    return !!request.user && rolesPermitidos.includes(request.user.rol);
  }
}
