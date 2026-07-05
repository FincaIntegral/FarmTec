import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolUsuario } from '../../shared/enums/rol-usuario.enum';
import type { JwtPayload } from '../../shared/interfaces/jwt-payload.interface';
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
