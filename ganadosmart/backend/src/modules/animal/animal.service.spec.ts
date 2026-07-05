import { ConflictException } from '@nestjs/common';
import { EstadoAnimal } from '../../shared/enums/estado-animal.enum';
import { SeveridadAlerta } from '../../shared/enums/severidad-alerta.enum';
import { TipoOrigenAlerta } from '../../shared/enums/tipo-origen-alerta.enum';
import { AlertaService } from '../alerta/alerta.service';
import { PotreroRepository } from '../potrero/potrero.repository';
import { ReproduccionRepository } from '../reproduccion/reproduccion.repository';
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
