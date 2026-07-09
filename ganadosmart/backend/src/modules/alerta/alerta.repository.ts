import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoOrigenAlerta } from '../../shared/enums/tipo-origen-alerta.enum';
import { Alerta } from './entities/alerta.entity';

export interface FiltrosAlerta {
  tipoOrigen?: TipoOrigenAlerta;
  leida?: boolean;
}

@Injectable()
export class AlertaRepository {
  constructor(
    @InjectRepository(Alerta)
    private readonly alertaRepo: Repository<Alerta>,
  ) {}

  findById(id: string, fincaId: string): Promise<Alerta | null> {
    return this.alertaRepo.findOne({ where: { id, fincaId } });
  }

  findAllByFinca(
    fincaId: string,
    filtros: FiltrosAlerta,
    pagina: number,
    limite: number,
  ): Promise<[Alerta[], number]> {
    return this.alertaRepo.findAndCount({
      where: {
        fincaId,
        ...(filtros.tipoOrigen && { tipoOrigen: filtros.tipoOrigen }),
        ...(filtros.leida !== undefined && { leida: filtros.leida }),
      },
      order: { fecha: 'DESC' },
      skip: (pagina - 1) * limite,
      take: limite,
    });
  }

  create(data: Partial<Alerta>): Promise<Alerta> {
    return this.alertaRepo.save(this.alertaRepo.create(data));
  }

  async marcarLeida(id: string, fincaId: string): Promise<Alerta | null> {
    await this.alertaRepo.update({ id, fincaId }, { leida: true });
    return this.findById(id, fincaId);
  }
}
