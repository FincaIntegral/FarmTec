import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaginacionMeta,
  PaginatedResponse,
} from '../../shared/dto/paginacion-meta.dto';
import { EstadoAprobacion } from '../../shared/enums/estado-aprobacion.enum';
import { RolUsuario } from '../../shared/enums/rol-usuario.enum';
import { TipoAprobacion } from '../../shared/enums/tipo-aprobacion.enum';
import { TipoOrigenAlerta } from '../../shared/enums/tipo-origen-alerta.enum';
import {
  ResultadoAprobacion,
  evaluarAutoAprobacionPorMonto,
} from '../../shared/utils/aprobacion.util';
import { AlertaService } from '../alerta/alerta.service';
import { ConfiguracionService } from '../configuracion/configuracion.service';
import { CrearGastoDto } from './dto/create-gasto.dto';
import { GastoResponse } from './dto/gasto-response.dto';
import { FiltrosGasto, GastoRepository } from './gasto.repository';

@Injectable()
export class GastoService {
  constructor(
    private readonly gastoRepository: GastoRepository,
    private readonly configuracionService: ConfiguracionService,
    private readonly alertaService: AlertaService,
  ) {}

  // Público: Reportes también lo corre antes de contar pendientes.
  async aplicarVencimientos(fincaId: string): Promise<void> {
    const config = await this.configuracionService.obtenerOCrear(fincaId);
    if (config.aplicaAGastos && config.diasEsperaAprobacion !== null) {
      await this.gastoRepository.autoAprobarVencidos(
        fincaId,
        config.diasEsperaAprobacion,
      );
    }
  }

  async findAll(
    fincaId: string,
    filtros: FiltrosGasto,
    pagina: number,
    limite: number,
  ): Promise<PaginatedResponse<GastoResponse>> {
    await this.aplicarVencimientos(fincaId);

    const [gastos, total] = await this.gastoRepository.findAllByFinca(
      fincaId,
      filtros,
      pagina,
      limite,
    );
    return {
      datos: gastos.map((g) => GastoResponse.build(g)),
      meta: PaginacionMeta.build(total, pagina, limite),
    };
  }

  async create(
    dto: CrearGastoDto,
    fincaId: string,
    creadoPor: string,
    rolCreador: RolUsuario,
  ): Promise<GastoResponse> {
    const config = await this.configuracionService.obtenerOCrear(fincaId);
    // Un gasto creado por el administrador SIEMPRE requiere aprobación
    // manual del dueño — nunca se auto-aprueba por monto ni por tiempo.
    const aprobacion: ResultadoAprobacion =
      rolCreador === RolUsuario.ADMINISTRADOR_FINCA
        ? {
            estadoAprobacion: EstadoAprobacion.PENDIENTE,
            tipoAprobacion: TipoAprobacion.PENDIENTE,
            autoAprobado: false,
          }
        : evaluarAutoAprobacionPorMonto(dto.monto, config.aplicaAGastos, config);

    const gasto = await this.gastoRepository.create({
      fincaId,
      categoria: dto.categoria,
      monto: dto.monto,
      descripcion: dto.descripcion ?? null,
      fecha: dto.fecha,
      creadoPor,
      ...aprobacion,
    });

    if (gasto.estadoAprobacion === EstadoAprobacion.PENDIENTE) {
      await this.alertaService.crear(
        fincaId,
        gasto.id,
        TipoOrigenAlerta.GASTO,
        `Gasto de ${gasto.categoria} por ${gasto.monto} pendiente de aprobación`,
      );
    }
    return GastoResponse.build(gasto);
  }

  async aprobar(
    id: string,
    fincaId: string,
    aprobadoPor: string,
  ): Promise<GastoResponse> {
    const gasto = await this.obtenerPendiente(id, fincaId);

    const actualizado = await this.gastoRepository.update(gasto.id, fincaId, {
      estadoAprobacion: EstadoAprobacion.APROBADO,
      tipoAprobacion: TipoAprobacion.DIRECTA,
      autoAprobado: false,
      aprobadoPor,
    });
    return GastoResponse.build(actualizado!);
  }

  async rechazar(
    id: string,
    fincaId: string,
    rechazadoPor: string,
    motivo?: string,
  ): Promise<GastoResponse> {
    const gasto = await this.obtenerPendiente(id, fincaId);

    const actualizado = await this.gastoRepository.update(gasto.id, fincaId, {
      estadoAprobacion: EstadoAprobacion.RECHAZADO,
      motivoRechazo: motivo ?? null,
      aprobadoPor: rechazadoPor,
    });
    return GastoResponse.build(actualizado!);
  }

  private async obtenerPendiente(id: string, fincaId: string) {
    await this.aplicarVencimientos(fincaId);

    const gasto = await this.gastoRepository.findById(id, fincaId);
    if (!gasto) {
      throw new NotFoundException('Gasto no encontrado');
    }
    if (gasto.estadoAprobacion !== EstadoAprobacion.PENDIENTE) {
      throw new ConflictException(`El gasto ya está ${gasto.estadoAprobacion}`);
    }
    return gasto;
  }
}
