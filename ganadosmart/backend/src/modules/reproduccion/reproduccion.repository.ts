import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CategoriaAnimal } from '../../shared/enums/categoria-animal.enum';
import { EstadoReproduccion } from '../../shared/enums/estado-reproduccion.enum';
import { Animal } from '../animal/entities/animal.entity';
import { HistorialPeso } from '../animal/entities/historial-peso.entity';
import { BecerroDto } from './dto/confirmar-parto.dto';
import { Reproduccion } from './entities/reproduccion.entity';

export interface FiltrosReproduccion {
  estado?: EstadoReproduccion;
  vacaId?: string;
}

@Injectable()
export class ReproduccionRepository {
  constructor(
    @InjectRepository(Reproduccion)
    private readonly reproduccionRepo: Repository<Reproduccion>,
    @InjectRepository(Animal)
    private readonly animalRepo: Repository<Animal>,
    private readonly dataSource: DataSource,
  ) {}

  findById(id: string, fincaId: string): Promise<Reproduccion | null> {
    return this.reproduccionRepo.findOne({ where: { id, fincaId } });
  }

  findAllByFinca(
    fincaId: string,
    filtros: FiltrosReproduccion,
    pagina: number,
    limite: number,
  ): Promise<[Reproduccion[], number]> {
    return this.reproduccionRepo.findAndCount({
      where: {
        fincaId,
        ...(filtros.estado && { estado: filtros.estado }),
        ...(filtros.vacaId && { vacaId: filtros.vacaId }),
      },
      order: { createdAt: 'DESC' },
      skip: (pagina - 1) * limite,
      take: limite,
    });
  }

  findAnimalById(id: string, fincaId: string): Promise<Animal | null> {
    return this.animalRepo.findOne({ where: { id, fincaId } });
  }

  async existeEnCursoParaVaca(vacaId: string, fincaId: string): Promise<boolean> {
    return (
      (await this.reproduccionRepo.countBy({
        vacaId,
        fincaId,
        estado: EstadoReproduccion.EN_CURSO,
      })) > 0
    );
  }

  async existeCodigoAnimal(codigo: string, fincaId: string): Promise<boolean> {
    return (await this.animalRepo.countBy({ codigo, fincaId })) > 0;
  }

  create(data: Partial<Reproduccion>): Promise<Reproduccion> {
    return this.reproduccionRepo.save(this.reproduccionRepo.create(data));
  }

  // Batch para el listado de animales — evita N+1: una sola query devuelve
  // qué vacas del lote tienen un evento en_curso.
  async vacasEnGestacion(animalIds: string[]): Promise<Set<string>> {
    if (animalIds.length === 0) {
      return new Set();
    }
    const filas = await this.reproduccionRepo.find({
      select: { vacaId: true },
      where: animalIds.map((id) => ({
        vacaId: id,
        estado: EstadoReproduccion.EN_CURSO,
      })),
    });
    return new Set(filas.map((f) => f.vacaId));
  }

  // Conteo del detalle: inseminaciones (animal como vaca) y servicios
  // (animal como toro) — el front muestra el que aplique según sexo.
  async conteoReproduccion(
    animalId: string,
    fincaId: string,
  ): Promise<{ inseminaciones: number; servicios: number }> {
    const [inseminaciones, servicios] = await Promise.all([
      this.reproduccionRepo.countBy({ vacaId: animalId, fincaId }),
      this.reproduccionRepo.countBy({ toroId: animalId, fincaId }),
    ]);
    return { inseminaciones, servicios };
  }

  marcarFallido(id: string, fincaId: string): Promise<Reproduccion | null> {
    return this.dataSource.transaction(async (manager) => {
      await manager.update(
        Reproduccion,
        { id, fincaId },
        { estado: EstadoReproduccion.FALLIDO },
      );
      return manager.findOne(Reproduccion, { where: { id, fincaId } });
    });
  }

  // Genealogía automática del parto exitoso — TODO en una sola transacción:
  // 1. crear el becerro con madre_id=vaca_id y padre_id=toro_id
  // 2. registrar peso de nacimiento (si vino) en historial_peso
  // 3. marcar la reproduccion exitosa con becerro_resultante_id
  // Si cualquier paso falla, se revierte todo.
  confirmarPartoExitoso(
    reproduccion: Reproduccion,
    becerro: BecerroDto,
    registradoPor: string,
  ): Promise<Reproduccion> {
    return this.dataSource.transaction(async (manager) => {
      const nuevoBecerro = await manager.save(
        manager.create(Animal, {
          fincaId: reproduccion.fincaId,
          codigo: becerro.codigo,
          categoria: CategoriaAnimal.BECERRO,
          sexo: becerro.sexo,
          madreId: reproduccion.vacaId,
          padreId: reproduccion.toroId,
          fechaNacimiento: becerro.fechaNacimiento ?? null,
        }),
      );

      if (becerro.pesoNacimiento) {
        await manager.insert(HistorialPeso, {
          animalId: nuevoBecerro.id,
          fincaId: reproduccion.fincaId,
          pesoKg: becerro.pesoNacimiento,
          fecha: becerro.fechaNacimiento ?? new Date().toISOString().slice(0, 10),
          registradoPor,
        });
      }

      await manager.update(
        Reproduccion,
        { id: reproduccion.id, fincaId: reproduccion.fincaId },
        {
          estado: EstadoReproduccion.EXITOSO,
          becerroResultanteId: nuevoBecerro.id,
        },
      );

      return (await manager.findOne(Reproduccion, {
        where: { id: reproduccion.id, fincaId: reproduccion.fincaId },
      }))!;
    });
  }
}
