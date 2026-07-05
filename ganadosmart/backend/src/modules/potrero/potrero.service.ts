import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaginacionMeta,
  PaginatedResponse,
} from '../../shared/dto/paginacion-meta.dto';
import { CrearMovimientoDto } from './dto/create-movimiento.dto';
import { CrearPotreroDto } from './dto/create-potrero.dto';
import {
  MovimientoResponse,
  PotreroResponse,
} from './dto/potrero-response.dto';
import { FiltrosMovimiento, PotreroRepository } from './potrero.repository';

@Injectable()
export class PotreroService {
  constructor(private readonly potreroRepository: PotreroRepository) {}

  async findAll(fincaId: string): Promise<PotreroResponse[]> {
    const potreros = await this.potreroRepository.findAllByFinca(fincaId);
    return potreros.map((p) => PotreroResponse.build(p));
  }

  async create(dto: CrearPotreroDto, fincaId: string): Promise<PotreroResponse> {
    if (await this.potreroRepository.existsNombreEnFinca(dto.nombre, fincaId)) {
      throw new BadRequestException(
        'Ya existe un potrero con ese nombre en esta finca',
      );
    }
    const potrero = await this.potreroRepository.create({ ...dto, fincaId });
    return PotreroResponse.build(potrero);
  }

  async update(
    id: string,
    fincaId: string,
    dto: CrearPotreroDto,
  ): Promise<PotreroResponse> {
    const existente = await this.potreroRepository.findById(id, fincaId);
    if (!existente) {
      throw new NotFoundException('Potrero no encontrado');
    }
    if (
      await this.potreroRepository.existsNombreEnFinca(dto.nombre, fincaId, id)
    ) {
      throw new BadRequestException(
        'Ya existe un potrero con ese nombre en esta finca',
      );
    }
    const potrero = await this.potreroRepository.update(id, fincaId, dto);
    return PotreroResponse.build(potrero!);
  }

  async findMovimientos(
    fincaId: string,
    filtros: FiltrosMovimiento,
    pagina: number,
    limite: number,
  ): Promise<PaginatedResponse<MovimientoResponse>> {
    const [movimientos, total] = await this.potreroRepository.findMovimientos(
      fincaId,
      filtros,
      pagina,
      limite,
    );
    return {
      datos: movimientos.map((m) => MovimientoResponse.build(m)),
      meta: PaginacionMeta.build(total, pagina, limite),
    };
  }

  async createMovimiento(
    dto: CrearMovimientoDto,
    fincaId: string,
    registradoPor: string,
  ): Promise<MovimientoResponse> {
    if (dto.potreroOrigenId === dto.potreroDestinoId) {
      throw new BadRequestException(
        'El potrero de origen y destino no pueden ser el mismo',
      );
    }

    const [animal, origen, destino] = await Promise.all([
      this.potreroRepository.findAnimalById(dto.animalId, fincaId),
      this.potreroRepository.findById(dto.potreroOrigenId, fincaId),
      this.potreroRepository.findById(dto.potreroDestinoId, fincaId),
    ]);
    if (!animal) {
      throw new BadRequestException('animalId no corresponde a esta finca');
    }
    if (!origen || !destino) {
      throw new BadRequestException(
        'potreroOrigenId o potreroDestinoId no corresponden a esta finca',
      );
    }

    const movimiento = await this.potreroRepository.createMovimiento({
      fincaId,
      animalId: dto.animalId,
      potreroOrigenId: dto.potreroOrigenId,
      potreroDestinoId: dto.potreroDestinoId,
      fecha: dto.fecha,
      observacion: dto.observacion,
      registradoPor,
    });
    return MovimientoResponse.build(movimiento);
  }
}
