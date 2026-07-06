import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, In, Repository } from 'typeorm';
import { CategoriaAnimal } from '../../shared/enums/categoria-animal.enum';
import { EstadoAnimal } from '../../shared/enums/estado-animal.enum';
import { SexoAnimal } from '../../shared/enums/sexo-animal.enum';
import { Animal } from './entities/animal.entity';
import { HistorialPeso } from './entities/historial-peso.entity';
import { Mortalidad } from './entities/mortalidad.entity';

export interface FiltrosAnimal {
  estado?: EstadoAnimal;
  sexo?: SexoAnimal;
  categoria?: CategoriaAnimal;
  buscar?: string;
  // Restringe a estos ids (resuelto por el filtro potreroId en el service)
  ids?: string[];
}

@Injectable()
export class AnimalRepository {
  constructor(
    @InjectRepository(Animal)
    private readonly animalRepo: Repository<Animal>,
    @InjectRepository(HistorialPeso)
    private readonly historialPesoRepo: Repository<HistorialPeso>,
    private readonly dataSource: DataSource,
  ) {}

  findById(id: string, fincaId: string): Promise<Animal | null> {
    return this.animalRepo.findOne({ where: { id, fincaId } });
  }

  async existsCodigoEnFinca(
    codigo: string,
    fincaId: string,
    excluirId?: string,
  ): Promise<boolean> {
    const qb = this.animalRepo
      .createQueryBuilder('animal')
      .where('animal.finca_id = :fincaId', { fincaId })
      .andWhere('animal.codigo = :codigo', { codigo });

    if (excluirId) {
      qb.andWhere('animal.id != :excluirId', { excluirId });
    }

    return (await qb.getCount()) > 0;
  }

  async findAllByFinca(
    fincaId: string,
    filtros: FiltrosAnimal,
    pagina: number,
    limite: number,
  ): Promise<[Animal[], number]> {
    const base = {
      fincaId,
      ...(filtros.estado && { estado: filtros.estado }),
      ...(filtros.sexo && { sexo: filtros.sexo }),
      ...(filtros.categoria && { categoria: filtros.categoria }),
      ...(filtros.ids && { id: In(filtros.ids) }),
    };

    // "buscar" cubre codigo y raza — el contrato menciona "nombre" pero
    // animal no tiene esa columna en schema.sql.
    const where = filtros.buscar
      ? [
          { ...base, codigo: ILike(`%${filtros.buscar}%`) },
          { ...base, raza: ILike(`%${filtros.buscar}%`) },
        ]
      : base;

    return this.animalRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (pagina - 1) * limite,
      take: limite,
    });
  }

  create(data: Partial<Animal>): Promise<Animal> {
    const animal = this.animalRepo.create(data);
    return this.animalRepo.save(animal);
  }

  async update(
    id: string,
    fincaId: string,
    data: Partial<Animal>,
  ): Promise<Animal | null> {
    await this.animalRepo.update({ id, fincaId }, data);
    return this.findById(id, fincaId);
  }

  async actualizarFoto(
    id: string,
    fincaId: string,
    fotoUrl: string,
  ): Promise<Animal | null> {
    await this.animalRepo.update({ id, fincaId }, { fotoUrl });
    return this.findById(id, fincaId);
  }

  registrarPeso(data: Partial<HistorialPeso>): Promise<HistorialPeso> {
    const registro = this.historialPesoRepo.create(data);
    return this.historialPesoRepo.save(registro);
  }

  async getPesoActual(animalId: string): Promise<number | null> {
    const ultimo = await this.historialPesoRepo.findOne({
      where: { animalId },
      order: { fecha: 'DESC' },
    });
    return ultimo?.pesoKg ?? null;
  }

  // Última pesada de cada animal en un solo query — evita N+1 en el
  // listado paginado (una query por animal sería 100 queries en el peor caso).
  async getPesosActuales(animalIds: string[]): Promise<Map<string, number>> {
    if (animalIds.length === 0) {
      return new Map();
    }

    const filas = await this.historialPesoRepo
      .createQueryBuilder('hp')
      .distinctOn(['hp.animal_id'])
      .where('hp.animal_id IN (:...animalIds)', { animalIds })
      .orderBy('hp.animal_id')
      .addOrderBy('hp.fecha', 'DESC')
      .getMany();

    return new Map(filas.map((f) => [f.animalId, f.pesoKg]));
  }

  getHistorialPeso(animalId: string): Promise<HistorialPeso[]> {
    return this.historialPesoRepo.find({
      where: { animalId },
      order: { fecha: 'DESC' },
    });
  }

  // Escribe mortalidad + cambia animal.estado='muerto' en una sola
  // transacción — ambas tablas son propiedad de este módulo.
  async registrarMortalidad(data: Partial<Mortalidad>): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.insert(Mortalidad, data);
      await manager.update(
        Animal,
        { id: data.animalId, fincaId: data.fincaId },
        { estado: EstadoAnimal.MUERTO },
      );
    });
  }

  // Reactivar: borra el registro de mortalidad (fue un error) y el animal
  // vuelve a 'activo'. Si el animal muere de nuevo más adelante, el
  // UNIQUE(animal_id) de mortalidad no molesta porque ya no queda fila vieja.
  async reactivar(id: string, fincaId: string): Promise<Animal | null> {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(Mortalidad, { animalId: id, fincaId });
      await manager.update(Animal, { id, fincaId }, { estado: EstadoAnimal.ACTIVO });
    });
    return this.findById(id, fincaId);
  }
}
