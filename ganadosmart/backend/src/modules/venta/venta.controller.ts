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
import { CrearVentaDto } from './dto/create-venta.dto';
import { ListarVentasQueryDto } from './dto/listar-ventas-query.dto';
import { RechazarDto } from './dto/rechazar.dto';
import { VentaService } from './venta.service';

const ROLES_FINANCIEROS = [
  RolUsuario.DUENO_FINCA,
  RolUsuario.ADMINISTRADOR_FINCA,
];

@Controller('ventas')
export class VentaController {
  constructor(private readonly ventaService: VentaService) {}

  @Roles(...ROLES_FINANCIEROS)
  @Get()
  findAll(
    @Query()
    {
      pagina,
      limite,
      estadoAprobacion,
      soloMisAprobaciones,
      fechaInicio,
      fechaFin,
    }: ListarVentasQueryDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.ventaService.findAll(
      usuario.fincaId,
      { estadoAprobacion, soloMisAprobaciones, fechaInicio, fechaFin },
      pagina,
      limite,
    );
  }

  @Roles(...ROLES_FINANCIEROS)
  @Post()
  create(@Body() dto: CrearVentaDto, @CurrentUser() usuario: JwtPayload) {
    return this.ventaService.create(dto, usuario.fincaId, usuario.sub, usuario.rol);
  }

  @Roles(RolUsuario.DUENO_FINCA)
  @Patch(':id/aprobar')
  aprobar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.ventaService.aprobar(id, usuario.fincaId, usuario.sub);
  }

  @Roles(RolUsuario.DUENO_FINCA)
  @Patch(':id/rechazar')
  rechazar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RechazarDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.ventaService.rechazar(
      id,
      usuario.fincaId,
      usuario.sub,
      dto.motivo,
    );
  }
}
