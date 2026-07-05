import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Animal } from '../animal/entities/animal.entity';
import { MovimientoGanado } from './entities/movimiento-ganado.entity';
import { Potrero } from './entities/potrero.entity';
import { PotreroRepository } from './potrero.repository';
import { PotreroService } from './potrero.service';

const FINCA = 'finca-1';

describe('PotreroService', () => {
  let repo: jest.Mocked<PotreroRepository>;
  let service: PotreroService;

  beforeEach(() => {
    repo = {
      findAllByFinca: jest.fn(),
      findById: jest.fn(),
      existsNombreEnFinca: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findAnimalById: jest.fn(),
      findMovimientos: jest.fn(),
      createMovimiento: jest.fn(),
      potrerosActuales: jest.fn(),
      animalesEnPotrero: jest.fn(),
    } as unknown as jest.Mocked<PotreroRepository>;
    service = new PotreroService(repo);
  });

  it('rechaza crear potrero con nombre duplicado en la finca', async () => {
    repo.existsNombreEnFinca.mockResolvedValue(true);
    await expect(
      service.create({ nombre: 'Potrero Norte' }, FINCA),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('404 al editar un potrero de otra finca', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(
      service.update('pot-x', FINCA, { nombre: 'Nuevo' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  describe('createMovimiento', () => {
    const dto = {
      animalId: 'animal-1',
      potreroOrigenId: 'pot-1',
      potreroDestinoId: 'pot-2',
      fecha: '2026-07-04',
    };

    it('rechaza origen igual a destino', async () => {
      await expect(
        service.createMovimiento(
          { ...dto, potreroDestinoId: dto.potreroOrigenId },
          FINCA,
          'user-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.createMovimiento).not.toHaveBeenCalled();
    });

    it('rechaza animal o potreros de otra finca', async () => {
      repo.findAnimalById.mockResolvedValue({ id: 'animal-1' } as Animal);
      repo.findById.mockImplementation((id) =>
        Promise.resolve(id === 'pot-1' ? ({ id } as Potrero) : null),
      );
      await expect(
        service.createMovimiento(dto, FINCA, 'user-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('registra el movimiento con finca y usuario del JWT', async () => {
      repo.findAnimalById.mockResolvedValue({ id: 'animal-1' } as Animal);
      repo.findById.mockImplementation((id) =>
        Promise.resolve({ id } as Potrero),
      );
      repo.createMovimiento.mockImplementation((data) =>
        Promise.resolve({ id: 'mov-1', ...data } as MovimientoGanado),
      );

      const result = await service.createMovimiento(dto, FINCA, 'user-1');

      expect(repo.createMovimiento).toHaveBeenCalledWith(
        expect.objectContaining({ fincaId: FINCA, registradoPor: 'user-1' }),
      );
      expect(result.potreroDestinoId).toBe('pot-2');
    });
  });
});
