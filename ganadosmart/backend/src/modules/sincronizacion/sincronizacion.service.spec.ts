import { BadRequestException, ConflictException } from '@nestjs/common';
import { EstadoSync } from '../../shared/enums/estado-sync.enum';
import { TipoAccionSync } from '../../shared/enums/tipo-accion-sync.enum';
import { AnimalService } from '../animal/animal.service';
import { PotreroService } from '../potrero/potrero.service';
import { AccionSync } from './entities/accion-sync.entity';
import { SincronizacionRepository } from './sincronizacion.repository';
import { SincronizacionService } from './sincronizacion.service';

const FINCA = 'finca-1';
const USER = 'user-1';
const ANIMAL = '11111111-1111-1111-1111-111111111111';

describe('SincronizacionService', () => {
  let repo: jest.Mocked<SincronizacionRepository>;
  let animalService: jest.Mocked<AnimalService>;
  let potreroService: jest.Mocked<PotreroService>;
  let service: SincronizacionService;
  let contador: number;

  beforeEach(() => {
    contador = 0;
    repo = {
      crear: jest.fn((data) =>
        Promise.resolve({ id: `accion-${++contador}`, ...data } as AccionSync),
      ),
      findById: jest.fn(),
      actualizarEstado: jest.fn(),
      sobrescribirMortalidad: jest.fn(),
    } as unknown as jest.Mocked<SincronizacionRepository>;
    animalService = {
      registrarPeso: jest.fn(),
      registrarMortalidad: jest.fn(),
    } as unknown as jest.Mocked<AnimalService>;
    potreroService = {
      createMovimiento: jest.fn(),
    } as unknown as jest.Mocked<PotreroService>;
    service = new SincronizacionService(repo, animalService, potreroService);
  });

  const accionPeso = {
    tipo: TipoAccionSync.REGISTRAR_PESO,
    timestampLocal: '2026-07-07T10:00:00Z',
    datos: { animalId: ANIMAL, pesoKg: 320.5, fecha: '2026-07-07' },
  };

  describe('procesarLote', () => {
    it('aplica las acciones en orden cronológico (no el orden del array)', async () => {
      const tarde = {
        tipo: TipoAccionSync.REGISTRAR_PESO,
        timestampLocal: '2026-07-07T15:00:00Z',
        datos: { animalId: ANIMAL, pesoKg: 325.0, fecha: '2026-07-07' },
      };
      // llega primero la más tardía
      const r = await service.procesarLote([tarde, accionPeso], FINCA, USER);

      expect(r.resultados).toHaveLength(2);
      expect(r.resultados.every((x) => x.estado === EstadoSync.APLICADO)).toBe(true);
      // el primer registrarPeso corresponde a la acción de las 10:00
      expect(animalService.registrarPeso.mock.calls[0][2].pesoKg).toBe(320.5);
      expect(animalService.registrarPeso.mock.calls[1][2].pesoKg).toBe(325.0);
    });

    it('reutiliza los services existentes con el usuario del JWT', async () => {
      await service.procesarLote([accionPeso], FINCA, USER);
      expect(animalService.registrarPeso).toHaveBeenCalledWith(
        ANIMAL,
        FINCA,
        { pesoKg: 320.5, fecha: '2026-07-07' },
        USER,
      );
    });

    it('409 del service → estado conflicto con detalle, sin frenar el lote', async () => {
      animalService.registrarMortalidad.mockRejectedValue(
        new ConflictException('El animal ya tiene mortalidad registrada'),
      );
      const mortalidad = {
        tipo: TipoAccionSync.REGISTRAR_MORTALIDAD,
        timestampLocal: '2026-07-07T09:00:00Z',
        datos: { animalId: ANIMAL, fecha: '2026-07-07', causa: 'accidente' },
      };

      const r = await service.procesarLote([mortalidad, accionPeso], FINCA, USER);

      expect(r.resultados[0].estado).toBe(EstadoSync.CONFLICTO);
      expect(r.resultados[0].detalleConflicto).toBeTruthy();
      // la segunda acción del lote se procesó igual
      expect(r.resultados[1].estado).toBe(EstadoSync.APLICADO);
    });

    it('payload inválido → estado error (no conflicto)', async () => {
      const rota = {
        tipo: TipoAccionSync.REGISTRAR_PESO,
        timestampLocal: '2026-07-07T09:00:00Z',
        datos: { animalId: 'no-es-uuid', pesoKg: 10, fecha: '2026-07-07' },
      };
      const r = await service.procesarLote([rota], FINCA, USER);
      expect(r.resultados[0].estado).toBe(EstadoSync.ERROR);
      expect(animalService.registrarPeso).not.toHaveBeenCalled();
    });
  });

  describe('resolverConflicto', () => {
    const conflicto = {
      id: 'accion-9',
      fincaId: FINCA,
      tipoAccion: TipoAccionSync.REGISTRAR_MORTALIDAD,
      estadoSync: EstadoSync.CONFLICTO,
      datos: { animalId: ANIMAL, fecha: '2026-07-07', causa: 'accidente' },
      detalleConflicto: {},
    } as unknown as AccionSync;

    it('usar_servidor descarta lo local y marca aplicado', async () => {
      repo.findById.mockResolvedValue(conflicto);
      const r = await service.resolverConflicto(
        { accionId: conflicto.id, decision: 'usar_servidor' },
        FINCA,
      );
      expect(r.estado).toBe(EstadoSync.APLICADO);
      expect(repo.sobrescribirMortalidad).not.toHaveBeenCalled();
    });

    it('usar_local sobreescribe la mortalidad existente', async () => {
      repo.findById.mockResolvedValue(conflicto);
      await service.resolverConflicto(
        { accionId: conflicto.id, decision: 'usar_local' },
        FINCA,
      );
      expect(repo.sobrescribirMortalidad).toHaveBeenCalledWith(
        ANIMAL,
        FINCA,
        '2026-07-07',
        'accidente',
      );
    });

    it('usar_local sobre un tipo sin soporte → 400', async () => {
      repo.findById.mockResolvedValue({
        ...conflicto,
        tipoAccion: TipoAccionSync.REGISTRAR_PESO,
      } as AccionSync);
      await expect(
        service.resolverConflicto(
          { accionId: conflicto.id, decision: 'usar_local' },
          FINCA,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('409 si la acción no está en conflicto', async () => {
      repo.findById.mockResolvedValue({
        ...conflicto,
        estadoSync: EstadoSync.APLICADO,
      } as AccionSync);
      await expect(
        service.resolverConflicto(
          { accionId: conflicto.id, decision: 'usar_servidor' },
          FINCA,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
