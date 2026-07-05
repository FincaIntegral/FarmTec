import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Animal } from '../animal/entities/animal.entity';
import { MovimientoGanado } from './entities/movimiento-ganado.entity';
import { Potrero } from './entities/potrero.entity';

export interface FiltrosMovimiento {
  animalId?: string;
  potreroId?: string;
}

@Injectable()
export class PotreroRepository {
  constructor(
    @InjectRepository(Potrero)
    private readonly potreroRepo: Repository<Potrero>,
    @InjectRepository(MovimientoGanado)
    private readonly movimientoRepo: Repository<MovimientoGanado>,
    @InjectRepository(Animal)
    private readonly animalRepo: Repository<Animal>,
  ) {}

  findAllByFinca(fincaId: string): Promise<Potrero[]> {
    return this.potreroRepo.find({
      where: { fincaId },
      order: { nombre: 'ASC' },
    });
  }

  findById(id: string, fincaId: string): Promise<Potrero | null> {
    return this.potreroRepo.findOne({ where: { id, fincaId } });
  }

  async existsNombreEnFinca(
    nombre: string,
    fincaId: string,
    excluirId?: string,
  ): Promise<boolean> {
    const qb = this.potreroRepo
      .createQueryBuilder('potrero')
      .where('potrero.finca_id = :fincaId', { fincaId })
      .andWhere('potrero.nombre = :nombre', { nombre });
    if (excluirId) {
      qb.andWhere('potrero.id != :excluirId', { excluirId });
    }
    return (await qb.getCount()) > 0;
  }

  create(data: Partial<Potrero>): Promise<Potrero> {
    return this.potreroRepo.save(this.potreroRepo.create(data));
  }

  async update(
    id: string,
    fincaId: string,
    data: Partial<Potrero>,
  ): Promise<Potrero | null> {
    await this.potreroRepo.update({ id, fincaId }, data);
    return this.findById(id, fincaId);
  }

  findAnimalById(id: string, fincaId: string): Promise<Animal | null> {
    return this.animalRepo.findOne({ where: { id, fincaId } });
  }

  findMovimientos(
    fincaId: string,
    filtros: FiltrosMovimiento,
    pagina: number,
    limite: number,
  ): Promise<[MovimientoGanado[], number]> {
    const qb = this.movimientoRepo
      .createQueryBuilder('mov')
      .where('mov.finca_id = :fincaId', { fincaId });

    if (filtros.animalId) {
      qb.andWhere('mov.animal_id = :animalId', { animalId: filtros.animalId });
    }
    if (filtros.potreroId) {
      qb.andWhere(
        new Brackets((w) =>
          w
            .where('mov.potrero_origen_id = :potreroId')
            .orWhere('mov.potrero_destino_id = :potreroId'),
        ),
      ).setParameter('potreroId', filtros.potreroId);
    }

    return qb
      .orderBy('mov.fecha', 'DESC')
      .addOrderBy('mov.created_at', 'DESC')
      .skip((pagina - 1) * limite)
      .take(limite)
      .getManyAndCount();
  }

  createMovimiento(data: Partial<MovimientoGanado>): Promise<MovimientoGanado> {
    return this.movimientoRepo.save(this.movimientoRepo.create(data));
  }

  // Potrero actual de cada animal = destino de su último movimiento.
  // Una sola query para el lote del listado (sin N+1).
  async potrerosActuales(animalIds: string[]): Promise<Map<string, string>> {
    if (animalIds.length === 0) {
      return new Map();
    }
    const filas = await this.movimientoRepo
      .createQueryBuilder('mov')
      .distinctOn(['mov.animal_id'])
      .where('mov.animal_id IN (:...animalIds)', { animalIds })
      .orderBy('mov.animal_id')
      .addOrderBy('mov.fecha', 'DESC')
      .addOrderBy('mov.created_at', 'DESC')
      .getMany();

    return new Map(filas.map((f) => [f.animalId, f.potreroDestinoId]));
  }

  // Animales cuyo último movimiento terminó en este potrero — para el
  // filtro potreroId de GET /animales.
  async animalesEnPotrero(potreroId: string, fincaId: string): Promise<string[]> {
    const filas: { animal_id: string }[] = await this.movimientoRepo.query(
      `SELECT animal_id
         FROM (SELECT DISTINCT ON (animal_id) animal_id, potrero_destino_id
                 FROM movimiento_ganado
                WHERE finca_id = $1
                ORDER BY animal_id, fecha DESC, created_at DESC) ultimos
        WHERE potrero_destino_id = $2`,
      [fincaId, potreroId],
    );
    return filas.map((f) => f.animal_id);
  }
}
