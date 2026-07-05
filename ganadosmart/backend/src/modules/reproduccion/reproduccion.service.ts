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
import { EstadoReproduccion } from '../../shared/enums/estado-reproduccion.enum';
import { SexoAnimal } from '../../shared/enums/sexo-animal.enum';
import { ConfirmarPartoDto } from './dto/confirmar-parto.dto';
import { CrearReproduccionDto } from './dto/create-reproduccion.dto';
import { ReproduccionResponse } from './dto/reproduccion-response.dto';
import {
  FiltrosReproduccion,
  ReproduccionRepository,
} from './reproduccion.repository';

// Gestación bovina promedio — solo informativo (fecha_probable_parto),
// el parto real se confirma manualmente.
const DIAS_GESTACION = 283;

@Injectable()
export class ReproduccionService {
  constructor(private readonly reproduccionRepository: ReproduccionRepository) {}

  async findAll(
    fincaId: string,
    filtros: FiltrosReproduccion,
    pagina: number,
    limite: number,
  ): Promise<PaginatedResponse<ReproduccionResponse>> {
    const [reproducciones, total] =
      await this.reproduccionRepository.findAllByFinca(
        fincaId,
        filtros,
        pagina,
        limite,
      );

    return {
      datos: reproducciones.map((r) => ReproduccionResponse.build(r)),
      meta: PaginacionMeta.build(total, pagina, limite),
    };
  }

  async create(
    dto: CrearReproduccionDto,
    fincaId: string,
  ): Promise<ReproduccionResponse> {
    const [toro, vaca] = await Promise.all([
      this.reproduccionRepository.findAnimalById(dto.toroId, fincaId),
      this.reproduccionRepository.findAnimalById(dto.vacaId, fincaId),
    ]);

    if (!toro || toro.sexo !== SexoAnimal.MACHO) {
      throw new BadRequestException(
        'toroId no corresponde a un macho de esta finca',
      );
    }
    if (!vaca || vaca.sexo !== SexoAnimal.HEMBRA) {
      throw new BadRequestException(
        'vacaId no corresponde a una hembra de esta finca',
      );
    }
    for (const animal of [toro, vaca]) {
      if (
        animal.estado === EstadoAnimal.MUERTO ||
        animal.estado === EstadoAnimal.VENDIDO
      ) {
        throw new BadRequestException(
          `El animal ${animal.codigo} está ${animal.estado}`,
        );
      }
    }

    if (
      await this.reproduccionRepository.existeEnCursoParaVaca(dto.vacaId, fincaId)
    ) {
      throw new ConflictException(
        'La vaca ya tiene un evento reproductivo en curso',
      );
    }

    const fechaProbableParto = new Date(dto.fecha);
    fechaProbableParto.setDate(fechaProbableParto.getDate() + DIAS_GESTACION);

    const reproduccion = await this.reproduccionRepository.create({
      fincaId,
      toroId: dto.toroId,
      vacaId: dto.vacaId,
      tipo: dto.tipo,
      fecha: dto.fecha,
      fechaProbableParto: fechaProbableParto.toISOString().slice(0, 10),
    });

    return ReproduccionResponse.build(reproduccion);
  }

  async confirmarParto(
    id: string,
    fincaId: string,
    dto: ConfirmarPartoDto,
    registradoPor: string,
  ): Promise<ReproduccionResponse> {
    const reproduccion = await this.reproduccionRepository.findById(id, fincaId);
    if (!reproduccion) {
      throw new NotFoundException('Reproducción no encontrada');
    }
    if (reproduccion.estado !== EstadoReproduccion.EN_CURSO) {
      throw new ConflictException(
        `La reproducción ya fue resuelta como ${reproduccion.estado}`,
      );
    }

    if (dto.resultado === 'fallido') {
      const actualizada = await this.reproduccionRepository.marcarFallido(
        id,
        fincaId,
      );
      return ReproduccionResponse.build(actualizada!);
    }

    if (!dto.becerro) {
      throw new BadRequestException(
        'becerro es requerido cuando el resultado es exitoso',
      );
    }
    if (
      await this.reproduccionRepository.existeCodigoAnimal(
        dto.becerro.codigo,
        fincaId,
      )
    ) {
      throw new BadRequestException(
        'El código del becerro ya está en uso en esta finca',
      );
    }

    const actualizada = await this.reproduccionRepository.confirmarPartoExitoso(
      reproduccion,
      dto.becerro,
      registradoPor,
    );
    return ReproduccionResponse.build(actualizada);
  }
}
