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
import { RechazarDto } from '../venta/dto/rechazar.dto';
import { CrearGastoDto } from './dto/create-gasto.dto';
import { ListarGastosQueryDto } from './dto/listar-gastos-query.dto';
import { GastoService } from './gasto.service';

const ROLES_FINANCIEROS = [
  RolUsuario.DUENO_FINCA,
  RolUsuario.ADMINISTRADOR_FINCA,
];

@Controller('gastos')
export class GastoController {
  constructor(private readonly gastoService: GastoService) {}

  @Roles(...ROLES_FINANCIEROS)
  @Get()
  findAll(
    @Query()
    {
      pagina,
      limite,
      categoria,
      estadoAprobacion,
      soloMisAprobaciones,
    }: ListarGastosQueryDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.gastoService.findAll(
      usuario.fincaId,
      { categoria, estadoAprobacion, soloMisAprobaciones },
      pagina,
      limite,
    );
  }

  @Roles(...ROLES_FINANCIEROS)
  @Post()
  create(@Body() dto: CrearGastoDto, @CurrentUser() usuario: JwtPayload) {
    return this.gastoService.create(dto, usuario.fincaId, usuario.sub);
  }

  @Roles(RolUsuario.DUENO_FINCA)
  @Patch(':id/aprobar')
  aprobar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.gastoService.aprobar(id, usuario.fincaId, usuario.sub);
  }

  @Roles(RolUsuario.DUENO_FINCA)
  @Patch(':id/rechazar')
  rechazar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RechazarDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.gastoService.rechazar(
      id,
      usuario.fincaId,
      usuario.sub,
      dto.motivo,
    );
  }
}
