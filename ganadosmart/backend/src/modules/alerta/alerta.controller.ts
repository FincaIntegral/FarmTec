import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolUsuario } from '../../shared/enums/rol-usuario.enum';
import type { JwtPayload } from '../../shared/interfaces/jwt-payload.interface';
import { AlertaService } from './alerta.service';
import { ListarAlertasQueryDto } from './dto/listar-alertas-query.dto';

const ROLES_ALERTAS = [
  RolUsuario.DUENO_FINCA,
  RolUsuario.ADMINISTRADOR_FINCA,
];

@Controller('alertas')
export class AlertaController {
  constructor(private readonly alertaService: AlertaService) {}

  @Roles(...ROLES_ALERTAS)
  @Get()
  findAll(
    @Query() { pagina, limite, tipoOrigen, leida }: ListarAlertasQueryDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.alertaService.findAll(
      usuario.fincaId,
      { tipoOrigen, leida },
      pagina,
      limite,
    );
  }

  @Roles(...ROLES_ALERTAS)
  @Patch(':id/marcar-leida')
  marcarLeida(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.alertaService.marcarLeida(id, usuario.fincaId);
  }
}
