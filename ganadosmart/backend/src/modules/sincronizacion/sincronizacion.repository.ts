import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { EstadoSync } from '../../shared/enums/estado-sync.enum';
import { AccionSync } from './entities/accion-sync.entity';
import { Mortalidad } from '../animal/entities/mortalidad.entity';

@Injectable()
export class SincronizacionRepository {
  constructor(
    @InjectRepository(AccionSync)
    private readonly accionRepo: Repository<AccionSync>,
    @InjectRepository(Mortalidad)
    private readonly mortalidadRepo: Repository<Mortalidad>,
  ) {}

  crear(data: Partial<AccionSync>): Promise<AccionSync> {
    return this.accionRepo.save(this.accionRepo.create(data));
  }

  findById(id: string, fincaId: string): Promise<AccionSync | null> {
    return this.accionRepo.findOne({ where: { id, fincaId } });
  }

  async actualizarEstado(
    id: string,
    estadoSync: EstadoSync,
    detalleConflicto: Record<string, unknown> | null = null,
  ): Promise<void> {
    // Cast: TypeORM no infiere bien Record<...>|null en columnas jsonb
    await this.accionRepo.update({ id }, {
      estadoSync,
      detalleConflicto,
      procesadoEn: new Date(),
    } as QueryDeepPartialEntity<AccionSync>);
  }

  // usar_local sobre un conflicto de mortalidad: el registro del servidor ya
  // existe (UNIQUE animal_id) — se sobreescriben fecha y causa con lo local.
  async sobrescribirMortalidad(
    animalId: string,
    fincaId: string,
    fecha: string,
    causa: string,
  ): Promise<void> {
    await this.mortalidadRepo.update({ animalId, fincaId }, { fecha, causa });
  }
}
