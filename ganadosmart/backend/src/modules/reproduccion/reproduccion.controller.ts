import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolUsuario } from '../../shared/enums/rol-usuario.enum';
import type { JwtPayload } from '../../shared/interfaces/jwt-payload.interface';
import { ConfirmarPartoDto } from './dto/confirmar-parto.dto';
import { CrearReproduccionDto } from './dto/create-reproduccion.dto';
import { ListarReproduccionesQueryDto } from './dto/listar-reproducciones-query.dto';
import { ReproduccionService } from './reproduccion.service';

const ROLES_CAMPO = [
  RolUsuario.DUENO_FINCA,
  RolUsuario.ADMINISTRADOR_FINCA,
  RolUsuario.VETERINARIO,
];

@Controller('reproducciones')
export class ReproduccionController {
  constructor(private readonly reproduccionService: ReproduccionService) {}

  @Get()
  findAll(
    @Query() { pagina, limite, estado, vacaId }: ListarReproduccionesQueryDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.reproduccionService.findAll(
      usuario.fincaId,
      { estado, vacaId },
      pagina,
      limite,
    );
  }

  @Roles(...ROLES_CAMPO)
  @Post()
  create(
    @Body() dto: CrearReproduccionDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.reproduccionService.create(dto, usuario.fincaId, usuario.sub);
  }

  @Roles(...ROLES_CAMPO)
  @Patch(':id/confirmar-parto')
  confirmarParto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmarPartoDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.reproduccionService.confirmarParto(
      id,
      usuario.fincaId,
      dto,
      usuario.sub,
    );
  }
}
