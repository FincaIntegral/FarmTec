import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PaginacionMeta,
  PaginatedResponse,
} from '../../shared/dto/paginacion-meta.dto';
import { SeveridadAlerta } from '../../shared/enums/severidad-alerta.enum';
import { TipoOrigenAlerta } from '../../shared/enums/tipo-origen-alerta.enum';
import { AlertaRepository, FiltrosAlerta } from './alerta.repository';
import { AlertaResponse } from './dto/alerta-response.dto';

@Injectable()
export class AlertaService {
  constructor(private readonly alertaRepository: AlertaRepository) {}

  async findAll(
    fincaId: string,
    filtros: FiltrosAlerta,
    pagina: number,
    limite: number,
  ): Promise<PaginatedResponse<AlertaResponse>> {
    const [alertas, total] = await this.alertaRepository.findAllByFinca(
      fincaId,
      filtros,
      pagina,
      limite,
    );
    return {
      datos: alertas.map((a) => AlertaResponse.build(a)),
      meta: PaginacionMeta.build(total, pagina, limite),
    };
  }

  async marcarLeida(id: string, fincaId: string): Promise<AlertaResponse> {
    const alerta = await this.alertaRepository.marcarLeida(id, fincaId);
    if (!alerta) {
      throw new NotFoundException('Alerta no encontrada');
    }
    return AlertaResponse.build(alerta);
  }

  // Hook interno para que otros módulos generen alertas (venta/gasto
  // pendiente de aprobación). No es un endpoint del contrato.
  async crear(
    fincaId: string,
    referenciaId: string,
    tipoOrigen: TipoOrigenAlerta,
    mensaje: string,
    severidad = SeveridadAlerta.MEDIA,
  ): Promise<void> {
    await this.alertaRepository.create({
      fincaId,
      referenciaId,
      tipoOrigen,
      mensaje,
      severidad,
    });
  }
}
