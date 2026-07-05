import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoAprobacion } from '../../shared/enums/estado-aprobacion.enum';
import { TipoAprobacion } from '../../shared/enums/tipo-aprobacion.enum';
import { Animal } from '../animal/entities/animal.entity';
import { Venta } from './entities/venta.entity';

export interface FiltrosVenta {
  estadoAprobacion?: EstadoAprobacion;
  soloMisAprobaciones?: boolean;
  fechaInicio?: string;
  fechaFin?: string;
}

@Injectable()
export class VentaRepository {
  constructor(
    @InjectRepository(Venta)
    private readonly ventaRepo: Repository<Venta>,
    @InjectRepository(Animal)
    private readonly animalRepo: Repository<Animal>,
  ) {}

  findById(id: string, fincaId: string): Promise<Venta | null> {
    return this.ventaRepo.findOne({ where: { id, fincaId } });
  }

  findAnimalById(id: string, fincaId: string): Promise<Animal | null> {
    return this.animalRepo.findOne({ where: { id, fincaId } });
  }

  findAllByFinca(
    fincaId: string,
    filtros: FiltrosVenta,
    pagina: number,
    limite: number,
  ): Promise<[Venta[], number]> {
    const qb = this.ventaRepo
      .createQueryBuilder('venta')
      .where('venta.finca_id = :fincaId', { fincaId });

    // Con la auto-aprobación perezosa ya aplicada, "las que debo resolver"
    // son exactamente las pendientes (las vencidas dejaron de estarlo).
    const estado = filtros.soloMisAprobaciones
      ? EstadoAprobacion.PENDIENTE
      : filtros.estadoAprobacion;
    if (estado) {
      qb.andWhere('venta.estado_aprobacion = :estado', { estado });
    }
    if (filtros.fechaInicio) {
      qb.andWhere('venta.fecha >= :fechaInicio', {
        fechaInicio: filtros.fechaInicio,
      });
    }
    if (filtros.fechaFin) {
      qb.andWhere('venta.fecha <= :fechaFin', { fechaFin: filtros.fechaFin });
    }

    return qb
      .orderBy('venta.created_at', 'DESC')
      .skip((pagina - 1) * limite)
      .take(limite)
      .getManyAndCount();
  }

  create(data: Partial<Venta>): Promise<Venta> {
    return this.ventaRepo.save(this.ventaRepo.create(data));
  }

  async update(
    id: string,
    fincaId: string,
    data: Partial<Venta>,
  ): Promise<Venta | null> {
    await this.ventaRepo.update({ id, fincaId }, data);
    return this.findById(id, fincaId);
  }

  // Auto-aprobación POR TIEMPO, evaluación perezosa (sin cron): un solo
  // UPDATE convierte en aprobadas las pendientes cuyo plazo venció.
  // Corre antes de cada listado/aprobación — el índice parcial
  // idx_venta_pendientes hace que sea barato.
  // ponytail: si el piloto llega a necesitar puntualidad de minutos u
  // orquestación de notificaciones, migrar a @nestjs/schedule.
  async autoAprobarVencidas(fincaId: string, diasEspera: number): Promise<void> {
    await this.ventaRepo
      .createQueryBuilder()
      .update(Venta)
      .set({
        estadoAprobacion: EstadoAprobacion.APROBADO,
        tipoAprobacion: TipoAprobacion.POR_TIEMPO,
        autoAprobado: true,
      })
      .where('finca_id = :fincaId', { fincaId })
      .andWhere('estado_aprobacion = :pendiente', {
        pendiente: EstadoAprobacion.PENDIENTE,
      })
      .andWhere("created_at < NOW() - (:dias * INTERVAL '1 day')", {
        dias: diasEspera,
      })
      .execute();
  }
}
