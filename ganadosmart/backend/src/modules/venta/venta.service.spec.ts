import { BadRequestException, ConflictException } from '@nestjs/common';
import { EstadoAnimal } from '../../shared/enums/estado-animal.enum';
import { EstadoAprobacion } from '../../shared/enums/estado-aprobacion.enum';
import { TipoAprobacion } from '../../shared/enums/tipo-aprobacion.enum';
import { AlertaService } from '../alerta/alerta.service';
import { ConfiguracionService } from '../configuracion/configuracion.service';
import { ConfiguracionAprobacion } from '../configuracion/entities/configuracion-aprobacion.entity';
import { Animal } from '../animal/entities/animal.entity';
import { Venta } from './entities/venta.entity';
import { VentaRepository } from './venta.repository';
import { VentaService } from './venta.service';

const FINCA = 'finca-1';

const configBase = {
  fincaId: FINCA,
  montoUmbralAuto: 500000,
  diasEsperaAprobacion: 3,
  aplicaAVentas: true,
  aplicaAGastos: true,
} as ConfiguracionAprobacion;

const dtoBase = { comprador: 'Frigorífico X', monto: 100000, fecha: '2026-07-04' };

describe('VentaService', () => {
  let repo: jest.Mocked<VentaRepository>;
  let configService: jest.Mocked<ConfiguracionService>;
  let alertaService: jest.Mocked<AlertaService>;
  let service: VentaService;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      findAnimalById: jest.fn(),
      findAllByFinca: jest.fn(),
      create: jest.fn((data) => Promise.resolve({ id: 'venta-1', ...data } as Venta)),
      update: jest.fn((id, _f, data) =>
        Promise.resolve({ id, fincaId: FINCA, ...data } as Venta),
      ),
      aprobarVenta: jest.fn((venta: Venta, data: Partial<Venta>) =>
        Promise.resolve({ ...venta, ...data } as Venta),
      ),
      autoAprobarVencidas: jest.fn(),
    } as unknown as jest.Mocked<VentaRepository>;
    configService = {
      obtenerOCrear: jest.fn().mockResolvedValue(configBase),
    } as unknown as jest.Mocked<ConfiguracionService>;
    alertaService = { crear: jest.fn() } as unknown as jest.Mocked<AlertaService>;
    service = new VentaService(repo, configService, alertaService);
  });

  describe('create — auto-aprobación por monto (leída de configuracion)', () => {
    it('monto bajo el umbral → aprobado/por_monto/auto_aprobado=true', async () => {
      const venta = await service.create(dtoBase, FINCA, 'user-1');

      expect(venta.estadoAprobacion).toBe(EstadoAprobacion.APROBADO);
      expect(venta.tipoAprobacion).toBe(TipoAprobacion.POR_MONTO);
      expect(venta.autoAprobado).toBe(true);
      // auto-aprobada: el Dueño no tiene nada que resolver, sin alerta
      expect(alertaService.crear).not.toHaveBeenCalled();
    });

    it('monto igual o sobre el umbral → pendiente + alerta al Dueño', async () => {
      const venta = await service.create(
        { ...dtoBase, monto: 500000 },
        FINCA,
        'user-1',
      );
      expect(venta.estadoAprobacion).toBe(EstadoAprobacion.PENDIENTE);
      expect(venta.tipoAprobacion).toBe(TipoAprobacion.PENDIENTE);
      expect(venta.autoAprobado).toBe(false);
      expect(alertaService.crear).toHaveBeenCalled();
    });

    it('umbral NULL → nunca auto-aprueba por monto', async () => {
      configService.obtenerOCrear.mockResolvedValue({
        ...configBase,
        montoUmbralAuto: null,
      } as ConfiguracionAprobacion);

      const venta = await service.create({ ...dtoBase, monto: 1 }, FINCA, 'u');
      expect(venta.estadoAprobacion).toBe(EstadoAprobacion.PENDIENTE);
    });

    it('aplicaAVentas=false → ignora el umbral', async () => {
      configService.obtenerOCrear.mockResolvedValue({
        ...configBase,
        aplicaAVentas: false,
      } as ConfiguracionAprobacion);

      const venta = await service.create(dtoBase, FINCA, 'u');
      expect(venta.autoAprobado).toBe(false);
    });

    it('animalId de otra finca → 400', async () => {
      repo.findAnimalById.mockResolvedValue(null);
      await expect(
        service.create({ ...dtoBase, animalId: 'ajeno' }, FINCA, 'u'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('animal ya vendido o muerto → 400 (no se vende dos veces)', async () => {
      repo.findAnimalById.mockResolvedValue({
        id: 'animal-1',
        codigo: 'VACA-001',
        estado: EstadoAnimal.VENDIDO,
      } as Animal);
      await expect(
        service.create({ ...dtoBase, animalId: 'animal-1' }, FINCA, 'u'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('vencimientos por tiempo (evaluación perezosa)', () => {
    it('corre el UPDATE de vencidas antes de listar', async () => {
      repo.findAllByFinca.mockResolvedValue([[], 0]);
      await service.findAll(FINCA, {}, 1, 20);
      expect(repo.autoAprobarVencidas).toHaveBeenCalledWith(FINCA, 3);
    });

    it('no corre si diasEspera es NULL o no aplica a ventas', async () => {
      configService.obtenerOCrear.mockResolvedValue({
        ...configBase,
        diasEsperaAprobacion: null,
      } as ConfiguracionAprobacion);
      repo.findAllByFinca.mockResolvedValue([[], 0]);
      await service.findAll(FINCA, {}, 1, 20);
      expect(repo.autoAprobarVencidas).not.toHaveBeenCalled();
    });
  });

  describe('aprobar / rechazar (solo sobre pendientes)', () => {
    const pendiente = {
      id: 'venta-1',
      fincaId: FINCA,
      estadoAprobacion: EstadoAprobacion.PENDIENTE,
    } as Venta;

    it('aprobar → directa, auto_aprobado=false, aprobado_por del JWT', async () => {
      repo.findById.mockResolvedValue(pendiente);

      const venta = await service.aprobar('venta-1', FINCA, 'dueno-1');

      expect(venta.tipoAprobacion).toBe(TipoAprobacion.DIRECTA);
      expect(venta.autoAprobado).toBe(false);
      expect(venta.aprobadoPor).toBe('dueno-1');
      // se evaluó el vencimiento por tiempo ANTES de resolver manualmente
      expect(repo.autoAprobarVencidas).toHaveBeenCalled();
      // la aprobación pasa por la ruta transaccional que vende el animal
      expect(repo.aprobarVenta).toHaveBeenCalledWith(
        pendiente,
        expect.objectContaining({ tipoAprobacion: TipoAprobacion.DIRECTA }),
      );
    });

    it('aprobar una ya resuelta (p.ej. auto-aprobada por tiempo) → 409', async () => {
      repo.findById.mockResolvedValue({
        ...pendiente,
        estadoAprobacion: EstadoAprobacion.APROBADO,
        autoAprobado: true,
      } as Venta);

      await expect(service.aprobar('venta-1', FINCA, 'd')).rejects.toBeInstanceOf(
        ConflictException,
      );
      // nunca se intenta revertir auto_aprobado
      expect(repo.aprobarVenta).not.toHaveBeenCalled();
    });

    it('rechazar guarda el motivo', async () => {
      repo.findById.mockResolvedValue(pendiente);
      const venta = await service.rechazar('venta-1', FINCA, 'dueno-1', 'precio bajo');
      expect(venta.estadoAprobacion).toBe(EstadoAprobacion.RECHAZADO);
      expect(venta.motivoRechazo).toBe('precio bajo');
    });
  });
});
