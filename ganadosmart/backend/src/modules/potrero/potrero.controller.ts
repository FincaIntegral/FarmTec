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
import { CrearMovimientoDto } from './dto/create-movimiento.dto';
import { CrearPotreroDto } from './dto/create-potrero.dto';
import { ListarMovimientosQueryDto } from './dto/listar-movimientos-query.dto';
import { PotreroService } from './potrero.service';

const ROLES_ESCRITURA = [
  RolUsuario.DUENO_FINCA,
  RolUsuario.ADMINISTRADOR_FINCA,
];
const ROLES_CAMPO = [...ROLES_ESCRITURA, RolUsuario.VETERINARIO];

@Controller('potreros')
export class PotreroController {
  constructor(private readonly potreroService: PotreroService) {}

  @Get()
  findAll(@CurrentUser() usuario: JwtPayload) {
    return this.potreroService.findAll(usuario.fincaId);
  }

  @Roles(...ROLES_ESCRITURA)
  @Post()
  create(@Body() dto: CrearPotreroDto, @CurrentUser() usuario: JwtPayload) {
    return this.potreroService.create(dto, usuario.fincaId);
  }

  // Rutas estáticas antes de :id para que "movimientos" no se parsee como UUID
  @Get('movimientos')
  findMovimientos(
    @Query() { pagina, limite, animalId, potreroId }: ListarMovimientosQueryDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.potreroService.findMovimientos(
      usuario.fincaId,
      { animalId, potreroId },
      pagina,
      limite,
    );
  }

  @Roles(...ROLES_CAMPO)
  @Post('movimientos')
  createMovimiento(
    @Body() dto: CrearMovimientoDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.potreroService.createMovimiento(
      dto,
      usuario.fincaId,
      usuario.sub,
    );
  }

  @Roles(...ROLES_ESCRITURA)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CrearPotreroDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.potreroService.update(id, usuario.fincaId, dto);
  }
}
