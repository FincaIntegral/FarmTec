import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriaGasto } from '../../shared/enums/categoria-gasto.enum';
import { EstadoAprobacion } from '../../shared/enums/estado-aprobacion.enum';
import { TipoAprobacion } from '../../shared/enums/tipo-aprobacion.enum';
import { Gasto } from './entities/gasto.entity';

export interface FiltrosGasto {
  categoria?: CategoriaGasto;
  estadoAprobacion?: EstadoAprobacion;
  soloMisAprobaciones?: boolean;
}

@Injectable()
export class GastoRepository {
  constructor(
    @InjectRepository(Gasto)
    private readonly gastoRepo: Repository<Gasto>,
  ) {}

  findById(id: string, fincaId: string): Promise<Gasto | null> {
    return this.gastoRepo.findOne({ where: { id, fincaId } });
  }

  findAllByFinca(
    fincaId: string,
    filtros: FiltrosGasto,
    pagina: number,
    limite: number,
  ): Promise<[Gasto[], number]> {
    const estado = filtros.soloMisAprobaciones
      ? EstadoAprobacion.PENDIENTE
      : filtros.estadoAprobacion;

    return this.gastoRepo.findAndCount({
      where: {
        fincaId,
        ...(filtros.categoria && { categoria: filtros.categoria }),
        ...(estado && { estadoAprobacion: estado }),
      },
      order: { createdAt: 'DESC' },
      skip: (pagina - 1) * limite,
      take: limite,
    });
  }

  create(data: Partial<Gasto>): Promise<Gasto> {
    return this.gastoRepo.save(this.gastoRepo.create(data));
  }

  async update(
    id: string,
    fincaId: string,
    data: Partial<Gasto>,
  ): Promise<Gasto | null> {
    await this.gastoRepo.update({ id, fincaId }, data);
    return this.findById(id, fincaId);
  }

  // Mismo mecanismo perezoso que venta.repository.ts (ver comentario allí).
  async autoAprobarVencidos(fincaId: string, diasEspera: number): Promise<void> {
    await this.gastoRepo
      .createQueryBuilder()
      .update(Gasto)
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
