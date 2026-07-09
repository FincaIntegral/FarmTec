import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolUsuario } from '../../shared/enums/rol-usuario.enum';
import type { JwtPayload } from '../../shared/interfaces/jwt-payload.interface';
import { LoteDto, ResolverConflictoDto } from './dto/lote.dto';
import { SincronizacionService } from './sincronizacion.service';

// Los mismos roles que registran peso/mortalidad/movimiento online.
const ROLES_CAMPO = [
  RolUsuario.DUENO_FINCA,
  RolUsuario.ADMINISTRADOR_FINCA,
  RolUsuario.VETERINARIO,
];

@Controller('sincronizacion')
export class SincronizacionController {
  constructor(private readonly sincronizacionService: SincronizacionService) {}

  @Roles(...ROLES_CAMPO)
  @Post('lote')
  @HttpCode(200)
  lote(@Body() dto: LoteDto, @CurrentUser() usuario: JwtPayload) {
    return this.sincronizacionService.procesarLote(
      dto.acciones,
      usuario.fincaId,
      usuario.sub,
    );
  }

  @Roles(...ROLES_CAMPO)
  @Post('resolver-conflicto')
  @HttpCode(200)
  resolverConflicto(
    @Body() dto: ResolverConflictoDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.sincronizacionService.resolverConflicto(dto, usuario.fincaId);
  }
}
