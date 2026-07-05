import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolUsuario } from '../../shared/enums/rol-usuario.enum';
import type { JwtPayload } from '../../shared/interfaces/jwt-payload.interface';
import { ConfiguracionService } from './configuracion.service';
import { ActualizarConfiguracionDto } from './dto/actualizar-configuracion.dto';
import { ConfiguracionAprobacionResponse } from './dto/configuracion-response.dto';

@Controller('configuracion/aprobacion')
export class ConfiguracionController {
  constructor(private readonly configuracionService: ConfiguracionService) {}

  @Get()
  async obtener(@CurrentUser() usuario: JwtPayload) {
    const config = await this.configuracionService.obtenerOCrear(usuario.fincaId);
    return ConfiguracionAprobacionResponse.build(config);
  }

  @Roles(RolUsuario.DUENO_FINCA)
  @Patch()
  async actualizar(
    @Body() dto: ActualizarConfiguracionDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    const config = await this.configuracionService.actualizar(
      usuario.fincaId,
      dto,
      usuario.sub,
    );
    return ConfiguracionAprobacionResponse.build(config);
  }
}
