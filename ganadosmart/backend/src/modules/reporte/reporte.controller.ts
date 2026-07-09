import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolUsuario } from '../../shared/enums/rol-usuario.enum';
import type { JwtPayload } from '../../shared/interfaces/jwt-payload.interface';
import { ActividadQueryDto } from './dto/actividad-query.dto';
import { IngresosVsGastosQueryDto } from './dto/ingresos-vs-gastos-query.dto';
import { ReporteService } from './reporte.service';

const ROLES_REPORTES = [
  RolUsuario.DUENO_FINCA,
  RolUsuario.ADMINISTRADOR_FINCA,
];

@Controller('reportes')
export class ReporteController {
  constructor(private readonly reporteService: ReporteService) {}

  @Roles(...ROLES_REPORTES)
  @Get('dashboard')
  dashboard(@CurrentUser() usuario: JwtPayload) {
    return this.reporteService.dashboard(usuario.fincaId);
  }

  // El historial de auditoría (quién hizo qué) es exclusivo del dueño.
  @Roles(RolUsuario.DUENO_FINCA)
  @Get('actividad')
  actividad(
    @Query() query: ActividadQueryDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.reporteService.actividad(usuario.fincaId, query);
  }

  // Mortalidad: datos por animal muerto (fecha + causa) para la pantalla de
  // Mortalidad. Disponible a todos los roles autenticados, igual que
  // GET /animales — no es un KPI financiero restringido.
  @Get('mortalidad')
  mortalidad(@CurrentUser() usuario: JwtPayload) {
    return this.reporteService.mortalidades(usuario.fincaId);
  }

  @Roles(...ROLES_REPORTES)
  @Get('ingresos-vs-gastos')
  ingresosVsGastos(
    @Query() { fechaInicio, fechaFin, categoria }: IngresosVsGastosQueryDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.reporteService.ingresosVsGastos(
      usuario.fincaId,
      fechaInicio,
      fechaFin,
      categoria,
    );
  }
}
