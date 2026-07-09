import { ConflictException } from '@nestjs/common';
import { EstadoAnimal } from '../../shared/enums/estado-animal.enum';
import { SeveridadAlerta } from '../../shared/enums/severidad-alerta.enum';
import { TipoOrigenAlerta } from '../../shared/enums/tipo-origen-alerta.enum';
import { AlertaService } from '../alerta/alerta.service';
import { PotreroRepository } from '../potrero/potrero.repository';
import { ReproduccionRepository } from '../reproduccion/reproduccion.repository';
import { SupabaseStorageService } from '../../shared/services/supabase-storage.service';
import { AnimalRepository } from './animal.repository';
import { AnimalService } from './animal.service';
import { Animal } from './entities/animal.entity';

const FINCA = 'finca-1';

describe('AnimalService — mortalidad', () => {
  let repo: jest.Mocked<AnimalRepository>;
  let alertaService: jest.Mocked<AlertaService>;
  let service: AnimalService;

  const vaca = {
    id: 'animal-1',
    codigo: 'VACA-001',
    estado: EstadoAnimal.ACTIVO,
  } as Animal;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      registrarMortalidad: jest.fn(),
    } as unknown as jest.Mocked<AnimalRepository>;
    alertaService = { crear: jest.fn() } as unknown as jest.Mocked<AlertaService>;
    service = new AnimalService(
      repo,
      {} as ReproduccionRepository,
      {} as PotreroRepository,
      alertaService,
      {} as SupabaseStorageService,
    );
  });

  it('registra mortalidad y genera alerta de origen animal severidad alta', async () => {
    repo.findById.mockResolvedValue(vaca);

    await service.registrarMortalidad(
      vaca.id,
      FINCA,
      { fecha: '2026-07-05', causa: 'accidente' },
      'user-1',
    );

    expect(repo.registrarMortalidad).toHaveBeenCalled();
    expect(alertaService.crear).toHaveBeenCalledWith(
      FINCA,
      vaca.id,
      TipoOrigenAlerta.ANIMAL,
      expect.stringContaining('VACA-001'),
      SeveridadAlerta.ALTA,
    );
  });

  it('animal ya muerto → 409 y sin alerta duplicada', async () => {
    repo.findById.mockResolvedValue({
      ...vaca,
      estado: EstadoAnimal.MUERTO,
    } as Animal);

    await expect(
      service.registrarMortalidad(
        vaca.id,
        FINCA,
        { fecha: '2026-07-05', causa: 'x' },
        'u',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(alertaService.crear).not.toHaveBeenCalled();
  });
});

describe('AnimalService — reactivar', () => {
  let repo: jest.Mocked<AnimalRepository>;
  let alertaService: jest.Mocked<AlertaService>;
  let reproduccionRepository: jest.Mocked<ReproduccionRepository>;
  let potreroRepository: jest.Mocked<PotreroRepository>;
  let service: AnimalService;

  const muerta = {
    id: 'animal-1',
    codigo: 'VACA-001',
    estado: EstadoAnimal.MUERTO,
  } as Animal;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      reactivar: jest.fn(),
      getPesoActual: jest.fn().mockResolvedValue(null),
      getHistorialPeso: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<AnimalRepository>;
    alertaService = { crear: jest.fn() } as unknown as jest.Mocked<AlertaService>;
    reproduccionRepository = {
      vacasEnGestacion: jest.fn().mockResolvedValue(new Set()),
      conteoReproduccion: jest
        .fn()
        .mockResolvedValue({ inseminaciones: 0, servicios: 0 }),
    } as unknown as jest.Mocked<ReproduccionRepository>;
    potreroRepository = {
      potrerosActuales: jest.fn().mockResolvedValue(new Map()),
    } as unknown as jest.Mocked<PotreroRepository>;
    service = new AnimalService(
      repo,
      reproduccionRepository,
      potreroRepository,
      alertaService,
      {} as SupabaseStorageService,
    );
  });

  it('reactiva un animal muerto, borra la mortalidad vieja y genera alerta media', async () => {
    repo.findById
      .mockResolvedValueOnce(muerta) // chequeo de estado
      .mockResolvedValueOnce({ ...muerta, estado: EstadoAnimal.ACTIVO }); // findOne posterior

    const resultado = await service.reactivar(muerta.id, FINCA, {
      motivo: 'diagnóstico equivocado',
    });

    expect(repo.reactivar).toHaveBeenCalledWith(muerta.id, FINCA);
    expect(alertaService.crear).toHaveBeenCalledWith(
      FINCA,
      muerta.id,
      TipoOrigenAlerta.ANIMAL,
      expect.stringContaining('diagnóstico equivocado'),
      SeveridadAlerta.MEDIA,
    );
    expect(resultado.estado).toBe(EstadoAnimal.ACTIVO);
  });

  it('animal no está muerto → 409 y no reactiva', async () => {
    repo.findById.mockResolvedValue({
      ...muerta,
      estado: EstadoAnimal.ACTIVO,
    } as Animal);

    await expect(
      service.reactivar(muerta.id, FINCA, { motivo: 'x' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repo.reactivar).not.toHaveBeenCalled();
    expect(alertaService.crear).not.toHaveBeenCalled();
  });

  describe('solicitarReactivacion (administrador)', () => {
    it('genera alerta severidad alta para el dueño y NO cambia el estado del animal', async () => {
      repo.findById.mockResolvedValue(muerta);

      const resultado = await service.solicitarReactivacion(muerta.id, FINCA, {
        motivo: 'creo que fue un error',
      });

      expect(repo.reactivar).not.toHaveBeenCalled();
      expect(alertaService.crear).toHaveBeenCalledWith(
        FINCA,
        muerta.id,
        TipoOrigenAlerta.ANIMAL,
        expect.stringContaining('creo que fue un error'),
        SeveridadAlerta.ALTA,
      );
      expect(resultado.mensaje).toBeDefined();
    });

    it('animal no está muerto → 409, sin alerta', async () => {
      repo.findById.mockResolvedValue({
        ...muerta,
        estado: EstadoAnimal.ACTIVO,
      } as Animal);

      await expect(
        service.solicitarReactivacion(muerta.id, FINCA, { motivo: 'x' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(alertaService.crear).not.toHaveBeenCalled();
    });
  });
});
