import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { PaginacionQueryDto } from '../../shared/dto/paginacion-query.dto';
import { RolUsuario } from '../../shared/enums/rol-usuario.enum';
import type { JwtPayload } from '../../shared/interfaces/jwt-payload.interface';
import { CambiarContrasenaDto } from './dto/cambiar-contrasena.dto';
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

  @Roles(RolUsuario.DUENO_FINCA)
  @Patch('usuarios/:id/desactivar')
  desactivar(
    @Param('id') usuarioId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.usuarioService.desactivar(usuarioId, usuario);
  }

  @Roles(RolUsuario.DUENO_FINCA)
  @Patch('usuarios/:id/reactivar')
  reactivar(
    @Param('id') usuarioId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.usuarioService.reactivar(usuarioId, usuario);
  }

  @Roles(RolUsuario.DUENO_FINCA)
  @Patch('usuarios/:id/password')
  cambiarContrasena(
    @Param('id') usuarioId: string,
    @Body() dto: CambiarContrasenaDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.usuarioService.cambiarContrasena(usuarioId, dto, usuario);
  }
}
