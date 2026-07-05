import { ConflictException } from '@nestjs/common';
import { CategoriaGasto } from '../../shared/enums/categoria-gasto.enum';
import { EstadoAprobacion } from '../../shared/enums/estado-aprobacion.enum';
import { TipoAprobacion } from '../../shared/enums/tipo-aprobacion.enum';
import { AlertaService } from '../alerta/alerta.service';
import { ConfiguracionService } from '../configuracion/configuracion.service';
import { ConfiguracionAprobacion } from '../configuracion/entities/configuracion-aprobacion.entity';
import { Gasto } from './entities/gasto.entity';
import { GastoRepository } from './gasto.repository';
import { GastoService } from './gasto.service';

const FINCA = 'finca-1';

const configBase = {
  fincaId: FINCA,
  montoUmbralAuto: 200000,
  diasEsperaAprobacion: 5,
  aplicaAVentas: true,
  aplicaAGastos: true,
} as ConfiguracionAprobacion;

const dtoBase = {
  categoria: CategoriaGasto.INSUMOS,
  monto: 50000,
  fecha: '2026-07-05',
};

describe('GastoService', () => {
  let repo: jest.Mocked<GastoRepository>;
  let configService: jest.Mocked<ConfiguracionService>;
  let service: GastoService;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      findAllByFinca: jest.fn(),
      create: jest.fn((data) => Promise.resolve({ id: 'gasto-1', ...data } as Gasto)),
      update: jest.fn((id, _f, data) =>
        Promise.resolve({ id, fincaId: FINCA, ...data } as Gasto),
      ),
      autoAprobarVencidos: jest.fn(),
    } as unknown as jest.Mocked<GastoRepository>;
    configService = {
      obtenerOCrear: jest.fn().mockResolvedValue(configBase),
    } as unknown as jest.Mocked<ConfiguracionService>;
    service = new GastoService(
      repo,
      configService,
      { crear: jest.fn() } as unknown as AlertaService,
    );
  });

  it('monto bajo el umbral → auto-aprobado por_monto', async () => {
    const gasto = await service.create(dtoBase, FINCA, 'user-1');
    expect(gasto.estadoAprobacion).toBe(EstadoAprobacion.APROBADO);
    expect(gasto.tipoAprobacion).toBe(TipoAprobacion.POR_MONTO);
    expect(gasto.autoAprobado).toBe(true);
  });

  it('aplicaAGastos=false → queda pendiente aunque el monto sea bajo', async () => {
    configService.obtenerOCrear.mockResolvedValue({
      ...configBase,
      aplicaAGastos: false,
    } as ConfiguracionAprobacion);

    const gasto = await service.create(dtoBase, FINCA, 'user-1');
    expect(gasto.estadoAprobacion).toBe(EstadoAprobacion.PENDIENTE);
  });

  it('corre el UPDATE de vencidos antes de listar', async () => {
    repo.findAllByFinca.mockResolvedValue([[], 0]);
    await service.findAll(FINCA, {}, 1, 20);
    expect(repo.autoAprobarVencidos).toHaveBeenCalledWith(FINCA, 5);
  });

  it('aprobar un gasto ya resuelto → 409 sin tocar auto_aprobado', async () => {
    repo.findById.mockResolvedValue({
      id: 'gasto-1',
      fincaId: FINCA,
      estadoAprobacion: EstadoAprobacion.APROBADO,
      autoAprobado: true,
    } as Gasto);

    await expect(service.aprobar('gasto-1', FINCA, 'd')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });
});
