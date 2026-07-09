import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoSync } from '../../shared/enums/estado-sync.enum';
import { TipoAccionSync } from '../../shared/enums/tipo-accion-sync.enum';
import { AnimalService } from '../animal/animal.service';
import { PotreroService } from '../potrero/potrero.service';
import { AccionSincronizacionDto, ResolverConflictoDto } from './dto/lote.dto';
import { SincronizacionRepository } from './sincronizacion.repository';

export interface ResultadoSincronizacion {
  accionId: string;
  estado: EstadoSync;
  mensaje?: string;
  detalleConflicto?: Record<string, unknown> | null;
}

// Procesa la cola offline del móvil. Cada acción se persiste en accion_sync
// (auditoría) y se aplica reutilizando los services existentes — la lógica de
// negocio (validaciones, transacciones, alertas de mortalidad) NO se duplica.
@Injectable()
export class SincronizacionService {
  constructor(
    private readonly sincronizacionRepository: SincronizacionRepository,
    private readonly animalService: AnimalService,
    private readonly potreroService: PotreroService,
  ) {}

  async procesarLote(
    acciones: AccionSincronizacionDto[],
    fincaId: string,
    usuarioId: string,
  ): Promise<{ resultados: ResultadoSincronizacion[] }> {
    // Orden cronológico según el momento real en que ocurrió cada acción
    // en el campo — no el orden de llegada del array.
    const ordenadas = [...acciones].sort((a, b) =>
      a.timestampLocal.localeCompare(b.timestampLocal),
    );

    const resultados: ResultadoSincronizacion[] = [];
    for (const accion of ordenadas) {
      const registro = await this.sincronizacionRepository.crear({
        fincaId,
        usuarioId,
        tipoAccion: accion.tipo,
        timestampLocal: new Date(accion.timestampLocal),
        versionBase: accion.versionBase ?? null,
        datos: accion.datos,
      });

      try {
        await this.aplicar(accion, fincaId, usuarioId);
        await this.sincronizacionRepository.actualizarEstado(
          registro.id,
          EstadoSync.APLICADO,
        );
        resultados.push({ accionId: registro.id, estado: EstadoSync.APLICADO });
      } catch (e) {
        // 409 = conflicto de concurrencia (ej. otro usuario ya registró la
        // mortalidad) → el usuario decide vía resolver-conflicto.
        // Cualquier otro error = acción inválida, no reintentable.
        const esConflicto = e instanceof ConflictException;
        const mensaje = e instanceof Error ? e.message : 'Error desconocido';
        const estado = esConflicto ? EstadoSync.CONFLICTO : EstadoSync.ERROR;
        const detalle = { versionLocal: accion.datos, versionServidor: { mensaje } };
        await this.sincronizacionRepository.actualizarEstado(
          registro.id,
          estado,
          detalle,
        );
        resultados.push({
          accionId: registro.id,
          estado,
          mensaje,
          detalleConflicto: esConflicto ? detalle : null,
        });
      }
    }
    return { resultados };
  }

  private async aplicar(
    accion: AccionSincronizacionDto,
    fincaId: string,
    usuarioId: string,
  ): Promise<void> {
    const d = accion.datos;
    const animalId = this.uuid(d, 'animalId');

    switch (accion.tipo) {
      case TipoAccionSync.REGISTRAR_PESO:
        await this.animalService.registrarPeso(
          animalId,
          fincaId,
          { pesoKg: this.numero(d, 'pesoKg'), fecha: this.texto(d, 'fecha') },
          usuarioId,
        );
        return;

      case TipoAccionSync.REGISTRAR_MORTALIDAD:
        await this.animalService.registrarMortalidad(
          animalId,
          fincaId,
          { fecha: this.texto(d, 'fecha'), causa: this.texto(d, 'causa') },
          usuarioId,
        );
        return;

      case TipoAccionSync.REGISTRAR_MOVIMIENTO:
        await this.potreroService.createMovimiento(
          {
            animalId,
            potreroOrigenId: this.uuid(d, 'potreroOrigenId'),
            potreroDestinoId: this.uuid(d, 'potreroDestinoId'),
            fecha: this.texto(d, 'fecha'),
          },
          fincaId,
          usuarioId,
        );
        return;
    }
  }

  async resolverConflicto(
    dto: ResolverConflictoDto,
    fincaId: string,
  ): Promise<{ accionId: string; estado: EstadoSync }> {
    const accion = await this.sincronizacionRepository.findById(
      dto.accionId,
      fincaId,
    );
    if (!accion) {
      throw new NotFoundException('Acción de sincronización no encontrada');
    }
    if (accion.estadoSync !== EstadoSync.CONFLICTO) {
      throw new ConflictException(
        `La acción está en estado ${accion.estadoSync}, no en conflicto`,
      );
    }

    if (dto.decision === 'usar_servidor') {
      // Se descarta el cambio local: el estado del servidor ya es el bueno.
      await this.sincronizacionRepository.actualizarEstado(
        accion.id,
        EstadoSync.APLICADO,
        accion.detalleConflicto,
      );
      return { accionId: accion.id, estado: EstadoSync.APLICADO };
    }

    // usar_local: solo la mortalidad tiene conflicto real de concurrencia
    // (UNIQUE animal_id — alguien más la registró primero). Se sobreescribe
    // fecha/causa del registro existente con la versión local.
    // ponytail: peso y movimiento no generan 409 en el backend actual; si
    // eso cambia, agregar el caso aquí.
    if (accion.tipoAccion !== TipoAccionSync.REGISTRAR_MORTALIDAD) {
      throw new BadRequestException(
        'usar_local solo está soportado para conflictos de mortalidad',
      );
    }
    const d = accion.datos;
    await this.sincronizacionRepository.sobrescribirMortalidad(
      this.uuid(d, 'animalId'),
      fincaId,
      this.texto(d, 'fecha'),
      this.texto(d, 'causa'),
    );
    await this.sincronizacionRepository.actualizarEstado(
      accion.id,
      EstadoSync.APLICADO,
      accion.detalleConflicto,
    );
    return { accionId: accion.id, estado: EstadoSync.APLICADO };
  }

  // ── Validación del payload variable (datos JSONB) ──

  private texto(datos: Record<string, unknown>, campo: string): string {
    const valor = datos[campo];
    if (typeof valor !== 'string' || valor.length === 0) {
      throw new BadRequestException(`datos.${campo} es requerido`);
    }
    return valor;
  }

  private uuid(datos: Record<string, unknown>, campo: string): string {
    const valor = this.texto(datos, campo);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor)) {
      throw new BadRequestException(`datos.${campo} debe ser un UUID`);
    }
    return valor;
  }

  private numero(datos: Record<string, unknown>, campo: string): number {
    const valor = datos[campo];
    if (typeof valor !== 'number' || !(valor > 0)) {
      throw new BadRequestException(`datos.${campo} debe ser un número positivo`);
    }
    return valor;
  }
}
