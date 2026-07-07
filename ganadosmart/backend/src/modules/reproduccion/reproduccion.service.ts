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
import { CategoriaAnimal } from '../../shared/enums/categoria-animal.enum';
import { EstadoAnimal } from '../../shared/enums/estado-animal.enum';
import { EstadoReproduccion } from '../../shared/enums/estado-reproduccion.enum';
import { SexoAnimal } from '../../shared/enums/sexo-animal.enum';
import { TipoReproduccion } from '../../shared/enums/tipo-reproduccion.enum';
import { Animal } from '../animal/entities/animal.entity';
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
    const tienePajilla = !!(dto.pajillaProveedor || dto.pajillaRaza);

    if (dto.tipo === TipoReproduccion.MONTA_NATURAL) {
      if (!dto.toroId) {
        throw new BadRequestException(
          'monta_natural requiere un toroId de la finca (monta física)',
        );
      }
      if (tienePajilla) {
        throw new BadRequestException(
          'monta_natural no admite pajilla externa',
        );
      }
    } else {
      // inseminacion: exactamente una de las dos opciones
      if (dto.toroId && tienePajilla) {
        throw new BadRequestException(
          'elige toroId de la finca O pajilla externa, no ambos',
        );
      }
      if (!dto.toroId && !tienePajilla) {
        throw new BadRequestException(
          'inseminacion requiere toroId de la finca o pajilla externa (proveedor y raza)',
        );
      }
      if (tienePajilla && (!dto.pajillaProveedor || !dto.pajillaRaza)) {
        throw new BadRequestException(
          'la pajilla externa requiere proveedor y raza',
        );
      }
    }

    let toro: Animal | null = null;
    if (dto.toroId) {
      toro = await this.reproduccionRepository.findAnimalById(dto.toroId, fincaId);
      if (!toro || toro.sexo !== SexoAnimal.MACHO) {
        throw new BadRequestException(
          'toroId no corresponde a un macho de esta finca',
        );
      }
      if (toro.categoria === CategoriaAnimal.BECERRO) {
        throw new BadRequestException(
          `El animal ${toro.codigo} es un becerro y no puede reproducirse`,
        );
      }
      // El toro solo debe estar vivo para monta natural — la inseminación
      // puede usar semen ya registrado de un toro fallecido o vendido.
      if (
        dto.tipo === TipoReproduccion.MONTA_NATURAL &&
        (toro.estado === EstadoAnimal.MUERTO || toro.estado === EstadoAnimal.VENDIDO)
      ) {
        throw new BadRequestException(`El animal ${toro.codigo} está ${toro.estado}`);
      }
    }

    const vaca = await this.reproduccionRepository.findAnimalById(dto.vacaId, fincaId);
    if (!vaca || vaca.sexo !== SexoAnimal.HEMBRA) {
      throw new BadRequestException(
        'vacaId no corresponde a una hembra de esta finca',
      );
    }
    // Un becerro todavía no está en edad reproductiva.
    if (vaca.categoria === CategoriaAnimal.BECERRO) {
      throw new BadRequestException(
        `El animal ${vaca.codigo} es un becerro y no puede reproducirse`,
      );
    }
    // La vaca siempre debe estar viva (gesta físicamente el evento).
    if (
      vaca.estado === EstadoAnimal.MUERTO ||
      vaca.estado === EstadoAnimal.VENDIDO
    ) {
      throw new BadRequestException(`El animal ${vaca.codigo} está ${vaca.estado}`);
    }

    // El evento (monta/inseminación) ya debe haber ocurrido.
    const hoy = new Date().toISOString().slice(0, 10);
    if (dto.fecha > hoy) {
      throw new BadRequestException(
        'La fecha del evento reproductivo no puede ser futura',
      );
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
      toroId: dto.toroId ?? null,
      pajillaProveedor: dto.pajillaProveedor ?? null,
      pajillaRaza: dto.pajillaRaza ?? null,
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
