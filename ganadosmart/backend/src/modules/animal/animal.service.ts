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
import { AnimalRepository, FiltrosAnimal } from './animal.repository';
import { ActualizarFotoDto } from './dto/actualizar-foto.dto';
import { AnimalListItemResponse } from './dto/animal-list-item.dto';
import { AnimalResponse } from './dto/animal-response.dto';
import { CrearAnimalDto } from './dto/create-animal.dto';
import { RegistrarMortalidadDto } from './dto/registrar-mortalidad.dto';
import { RegistrarPesoDto } from './dto/registrar-peso.dto';

@Injectable()
export class AnimalService {
  constructor(private readonly animalRepository: AnimalRepository) {}

  async findAll(
    fincaId: string,
    filtros: FiltrosAnimal,
    pagina: number,
    limite: number,
  ): Promise<PaginatedResponse<AnimalListItemResponse>> {
    const [animales, total] = await this.animalRepository.findAllByFinca(
      fincaId,
      filtros,
      pagina,
      limite,
    );

    const pesos = await this.animalRepository.getPesosActuales(
      animales.map((a) => a.id),
    );

    return {
      datos: animales.map((animal) =>
        AnimalListItemResponse.build(animal, pesos.get(animal.id) ?? null),
      ),
      meta: PaginacionMeta.build(total, pagina, limite),
    };
  }

  async findOne(id: string, fincaId: string): Promise<AnimalResponse> {
    const animal = await this.animalRepository.findById(id, fincaId);
    if (!animal) {
      throw new NotFoundException('Animal no encontrado');
    }

    const [pesoActual, historialPeso] = await Promise.all([
      this.animalRepository.getPesoActual(id),
      this.animalRepository.getHistorialPeso(id),
    ]);

    return AnimalResponse.buildDetalle(animal, pesoActual, historialPeso);
  }

  async create(dto: CrearAnimalDto, fincaId: string): Promise<AnimalResponse> {
    await this.validarCodigoYPadres(dto, fincaId);

    const animal = await this.animalRepository.create({
      fincaId,
      codigo: dto.codigo,
      categoria: dto.categoria,
      sexo: dto.sexo,
      fechaNacimiento: dto.fechaNacimiento,
      raza: dto.raza,
      madreId: dto.madreId,
      padreId: dto.padreId,
    });

    return AnimalResponse.buildDetalle(animal, null, []);
  }

  async update(
    id: string,
    fincaId: string,
    dto: CrearAnimalDto,
  ): Promise<AnimalResponse> {
    const existente = await this.animalRepository.findById(id, fincaId);
    if (!existente) {
      throw new NotFoundException('Animal no encontrado');
    }

    await this.validarCodigoYPadres(dto, fincaId, id);

    const animal = await this.animalRepository.update(id, fincaId, {
      codigo: dto.codigo,
      categoria: dto.categoria,
      sexo: dto.sexo,
      fechaNacimiento: dto.fechaNacimiento,
      raza: dto.raza,
      madreId: dto.madreId,
      padreId: dto.padreId,
    });

    const [pesoActual, historialPeso] = await Promise.all([
      this.animalRepository.getPesoActual(id),
      this.animalRepository.getHistorialPeso(id),
    ]);

    return AnimalResponse.buildDetalle(animal!, pesoActual, historialPeso);
  }

  async registrarPeso(
    id: string,
    fincaId: string,
    dto: RegistrarPesoDto,
    registradoPor: string,
  ): Promise<void> {
    const animal = await this.animalRepository.findById(id, fincaId);
    if (!animal) {
      throw new NotFoundException('Animal no encontrado');
    }

    await this.animalRepository.registrarPeso({
      animalId: id,
      fincaId,
      pesoKg: dto.pesoKg,
      fecha: dto.fecha,
      registradoPor,
    });
  }

  async registrarMortalidad(
    id: string,
    fincaId: string,
    dto: RegistrarMortalidadDto,
    registradoPor: string,
  ): Promise<void> {
    const animal = await this.animalRepository.findById(id, fincaId);
    if (!animal) {
      throw new NotFoundException('Animal no encontrado');
    }
    if (animal.estado === EstadoAnimal.MUERTO) {
      throw new ConflictException('El animal ya está registrado como muerto');
    }

    await this.animalRepository.registrarMortalidad({
      animalId: id,
      fincaId,
      fecha: dto.fecha,
      causa: dto.causa,
      registradoPor,
    });
  }

  async actualizarFoto(
    id: string,
    fincaId: string,
    dto: ActualizarFotoDto,
  ): Promise<void> {
    const animal = await this.animalRepository.findById(id, fincaId);
    if (!animal) {
      throw new NotFoundException('Animal no encontrado');
    }

    await this.animalRepository.actualizarFoto(id, fincaId, dto.fotoUrl);
  }

  private async validarCodigoYPadres(
    dto: CrearAnimalDto,
    fincaId: string,
    excluirId?: string,
  ): Promise<void> {
    const codigoDuplicado = await this.animalRepository.existsCodigoEnFinca(
      dto.codigo,
      fincaId,
      excluirId,
    );
    if (codigoDuplicado) {
      throw new BadRequestException('El código ya está en uso en esta finca');
    }

    for (const [campo, id] of [
      ['madreId', dto.madreId],
      ['padreId', dto.padreId],
    ] as const) {
      if (id && !(await this.animalRepository.findById(id, fincaId))) {
        throw new BadRequestException(
          `${campo} no corresponde a un animal de esta finca`,
        );
      }
    }
  }
}
