import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaginacionMeta,
  PaginatedResponse,
} from '../../shared/dto/paginacion-meta.dto';
import { EstadoAnimal } from '../../shared/enums/estado-animal.enum';
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
import { CrearVentaDto } from './dto/create-venta.dto';
import { VentaResponse } from './dto/venta-response.dto';
import { FiltrosVenta, VentaRepository } from './venta.repository';

@Injectable()
export class VentaService {
  constructor(
    private readonly ventaRepository: VentaRepository,
    private readonly configuracionService: ConfiguracionService,
    private readonly alertaService: AlertaService,
  ) {}

  // Aplica la auto-aprobación por tiempo pendiente antes de leer o resolver.
  // Público: Reportes también lo corre antes de contar pendientes.
  async aplicarVencimientos(fincaId: string): Promise<void> {
    const config = await this.configuracionService.obtenerOCrear(fincaId);
    if (config.aplicaAVentas && config.diasEsperaAprobacion !== null) {
      await this.ventaRepository.autoAprobarVencidas(
        fincaId,
        config.diasEsperaAprobacion,
      );
    }
  }

  async findAll(
    fincaId: string,
    filtros: FiltrosVenta,
    pagina: number,
    limite: number,
  ): Promise<PaginatedResponse<VentaResponse>> {
    await this.aplicarVencimientos(fincaId);

    const [ventas, total] = await this.ventaRepository.findAllByFinca(
      fincaId,
      filtros,
      pagina,
      limite,
    );
    return {
      datos: ventas.map((v) => VentaResponse.build(v)),
      meta: PaginacionMeta.build(total, pagina, limite),
    };
  }

  async create(
    dto: CrearVentaDto,
    fincaId: string,
    creadoPor: string,
    rolCreador: RolUsuario,
  ): Promise<VentaResponse> {
    if (dto.animalId) {
      const animal = await this.ventaRepository.findAnimalById(
        dto.animalId,
        fincaId,
      );
      if (!animal) {
        throw new BadRequestException(
          'animalId no corresponde a un animal de esta finca',
        );
      }
      // vendido y muerto son estados terminales — no se venden dos veces
      if (
        animal.estado === EstadoAnimal.VENDIDO ||
        animal.estado === EstadoAnimal.MUERTO
      ) {
        throw new BadRequestException(
          `El animal ${animal.codigo} está ${animal.estado}`,
        );
      }
    }

    const config = await this.configuracionService.obtenerOCrear(fincaId);
    // Una venta creada por el administrador SIEMPRE requiere aprobación
    // manual del dueño — nunca se auto-aprueba por monto ni por tiempo.
    const aprobacion: ResultadoAprobacion =
      rolCreador === RolUsuario.ADMINISTRADOR_FINCA
        ? {
            estadoAprobacion: EstadoAprobacion.PENDIENTE,
            tipoAprobacion: TipoAprobacion.PENDIENTE,
            autoAprobado: false,
          }
        : evaluarAutoAprobacionPorMonto(dto.monto, config.aplicaAVentas, config);

    const venta = await this.ventaRepository.create({
      fincaId,
      animalId: dto.animalId ?? null,
      comprador: dto.comprador,
      monto: dto.monto,
      fecha: dto.fecha,
      creadoPor,
      ...aprobacion,
    });

    if (venta.estadoAprobacion === EstadoAprobacion.PENDIENTE) {
      await this.alertaService.crear(
        fincaId,
        venta.id,
        TipoOrigenAlerta.VENTA,
        `Venta a ${venta.comprador} por ${venta.monto} pendiente de aprobación`,
      );
    }
    return VentaResponse.build(venta);
  }

  async aprobar(
    id: string,
    fincaId: string,
    aprobadoPor: string,
  ): Promise<VentaResponse> {
    const venta = await this.obtenerPendiente(id, fincaId);

    // Transacción: aprueba la venta y marca el animal como vendido si aplica
    const actualizada = await this.ventaRepository.aprobarVenta(venta, {
      estadoAprobacion: EstadoAprobacion.APROBADO,
      tipoAprobacion: TipoAprobacion.DIRECTA,
      autoAprobado: false,
      aprobadoPor,
    });
    return VentaResponse.build(actualizada!);
  }

  async rechazar(
    id: string,
    fincaId: string,
    rechazadoPor: string,
    motivo?: string,
  ): Promise<VentaResponse> {
    const venta = await this.obtenerPendiente(id, fincaId);

    const actualizada = await this.ventaRepository.update(venta.id, fincaId, {
      estadoAprobacion: EstadoAprobacion.RECHAZADO,
      motivoRechazo: motivo ?? null,
      aprobadoPor: rechazadoPor,
    });
    return VentaResponse.build(actualizada!);
  }

  // La resolución manual solo aplica sobre pendientes. Se corren primero los
  // vencimientos por tiempo: si el plazo ya venció, la venta quedó
  // auto-aprobada (permanente) y el intento manual responde 409.
  private async obtenerPendiente(id: string, fincaId: string) {
    await this.aplicarVencimientos(fincaId);

    const venta = await this.ventaRepository.findById(id, fincaId);
    if (!venta) {
      throw new NotFoundException('Venta no encontrada');
    }
    if (venta.estadoAprobacion !== EstadoAprobacion.PENDIENTE) {
      throw new ConflictException(
        `La venta ya está ${venta.estadoAprobacion}`,
      );
    }
    return venta;
  }
}
