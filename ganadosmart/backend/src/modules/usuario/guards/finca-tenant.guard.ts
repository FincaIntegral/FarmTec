import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../shared/decorators/public.decorator';
import { JwtPayload } from '../../../shared/interfaces/jwt-payload.interface';
import { UsuarioRepository } from '../usuario.repository';

// Verifica que el usuario del JWT siga activo en BD. jwt-auth.guard solo
// valida la firma/expiración del token, no si el usuario fue desactivado
// después de emitirlo — sin esto, un usuario dado de baja podría seguir
// operando hasta que su token expire.
@Injectable()
export class FincaTenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const payload = request.user;
    if (!payload) {
      return false;
    }

    const usuario = await this.usuarioRepository.findById(
      payload.sub,
      payload.fincaId,
    );
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Usuario inactivo o inexistente');
    }

    return true;
  }
}
