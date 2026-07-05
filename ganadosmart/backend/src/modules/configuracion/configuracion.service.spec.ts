import { ConfiguracionRepository } from './configuracion.repository';
import { ConfiguracionService } from './configuracion.service';
import { ConfiguracionAprobacion } from './entities/configuracion-aprobacion.entity';

describe('ConfiguracionService', () => {
  let repo: jest.Mocked<ConfiguracionRepository>;
  let service: ConfiguracionService;

  const config = {
    id: 'cfg-1',
    fincaId: 'finca-1',
    montoUmbralAuto: 500000,
    diasEsperaAprobacion: 3,
    aplicaAVentas: true,
    aplicaAGastos: true,
  } as ConfiguracionAprobacion;

  beforeEach(() => {
    repo = {
      findByFinca: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<ConfiguracionRepository>;
    service = new ConfiguracionService(repo);
  });

  it('devuelve la configuración existente sin crear otra', async () => {
    repo.findByFinca.mockResolvedValue(config);

    await expect(service.obtenerOCrear('finca-1')).resolves.toBe(config);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('crea la fila con defaults si la finca no tiene configuración', async () => {
    repo.findByFinca.mockResolvedValue(null);
    repo.create.mockResolvedValue(config);

    await service.obtenerOCrear('finca-1');
    expect(repo.create).toHaveBeenCalledWith({ fincaId: 'finca-1' });
  });

  it('actualiza solo los campos enviados y registra configurado_por', async () => {
    repo.findByFinca.mockResolvedValue(config);
    repo.update.mockResolvedValue(config);

    // null explícito desactiva el umbral; campos ausentes no se tocan
    await service.actualizar('finca-1', { montoUmbralAuto: null }, 'user-1');

    expect(repo.update).toHaveBeenCalledWith('finca-1', {
      montoUmbralAuto: null,
      configuradoPor: 'user-1',
    });
  });
});
