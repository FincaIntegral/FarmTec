import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

interface RequestWithUser {
  user: JwtPayload;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
