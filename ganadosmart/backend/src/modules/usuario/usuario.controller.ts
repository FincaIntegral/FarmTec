import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { PaginacionQueryDto } from '../../shared/dto/paginacion-query.dto';
import { RolUsuario } from '../../shared/enums/rol-usuario.enum';
import type { JwtPayload } from '../../shared/interfaces/jwt-payload.interface';
import { CrearUsuarioDto } from './dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { UsuarioService } from './usuario.service';

@Controller()
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Public()
  @Post('auth/login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.usuarioService.login(dto);
  }

  @Roles(RolUsuario.DUENO_FINCA)
  @Get('usuarios')
  findAll(
    @Query() { pagina, limite }: PaginacionQueryDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.usuarioService.findAll(usuario.fincaId, pagina, limite);
  }

  @Roles(RolUsuario.DUENO_FINCA)
  @Post('usuarios')
  create(@Body() dto: CrearUsuarioDto, @CurrentUser() usuario: JwtPayload) {
    return this.usuarioService.create(dto, usuario.fincaId);
  }
}
