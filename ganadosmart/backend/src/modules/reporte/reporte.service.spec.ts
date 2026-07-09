import { GastoService } from '../gasto/gasto.service';
import { VentaService } from '../venta/venta.service';
import { ReporteRepository } from './reporte.repository';
import { ReporteService } from './reporte.service';

const FINCA = 'finca-1';

describe('ReporteService', () => {
  let repo: jest.Mocked<ReporteRepository>;
  let service: ReporteService;
  const ventaService = {
    aplicarVencimientos: jest.fn(),
  } as unknown as jest.Mocked<VentaService>;
  const gastoService = {
    aplicarVencimientos: jest.fn(),
  } as unknown as jest.Mocked<GastoService>;

  beforeEach(() => {
    repo = {
      conteosHato: jest.fn().mockResolvedValue({
        total: '10',
        vacas: '5',
        toros: '2',
        becerros: '3',
        machos: '4',
        hembras: '6',
        en_tratamiento: '1',
        valor_hato: '25000000.00',
      }),
      pesoPromedio: jest.fn().mockResolvedValue(310.5),
      conteosReproduccion: jest.fn().mockResolvedValue({
        partos_exitosos_12m: '2',
        inseminaciones_7d: '1',
        proximos_a_parto: '1',
      }),
      muertes12Meses: jest.fn().mockResolvedValue(1),
      totalMuertos: jest.fn().mockResolvedValue(3),
      pesajes7Dias: jest.fn().mockResolvedValue(4),
      finanzasMesActual: jest.fn().mockResolvedValue({
        ingresos_mes: '3000000',
        gastos_mes: '1000000',
        pendientes: '2',
        auto_aprobadas: '3',
        total_transacciones: '4',
      }),
      transacciones: jest.fn(),
      actividad: jest.fn(),
      mortalidades: jest.fn(),
    } as unknown as jest.Mocked<ReporteRepository>;
    service = new ReporteService(repo, ventaService, gastoService);
  });

  it('dashboard arma KPIs y corre los vencimientos antes de contar', async () => {
    const d = await service.dashboard(FINCA);

    expect(ventaService.aplicarVencimientos).toHaveBeenCalledWith(FINCA);
    expect(gastoService.aplicarVencimientos).toHaveBeenCalledWith(FINCA);
    expect(d.totalAnimales).toBe(10);
    expect(d.animalesMuertos).toBe(3);
    expect(d.balanceMes).toBe(2000000);
    expect(d.tasaNatalidad).toBe(40); // 2 partos / 5 vacas
    expect(d.tasaMortalidad).toBe(9.09); // 1 / (10+1)
    expect(d.porcentajeAutoAprobado).toBe(75); // 3 de 4
    expect(d.valorEstimadoHato).toBe(25000000);
    expect(d.distribucionPorSexo).toEqual({ machos: 4, hembras: 6 });
  });

  it('ingresos-vs-gastos: solo lo aprobado suma, todo se lista', async () => {
    repo.transacciones.mockResolvedValue([
      {
        tipo: 'venta',
        fecha: '2026-07-01',
        monto: '1000000',
        estado_aprobacion: 'aprobado',
        tipo_aprobacion: 'por_monto',
        categoria: null,
      },
      {
        tipo: 'gasto',
        fecha: '2026-07-02',
        monto: '400000',
        estado_aprobacion: 'aprobado',
        tipo_aprobacion: 'directa',
        categoria: 'insumos',
      },
      {
        tipo: 'gasto',
        fecha: '2026-07-03',
        monto: '999999',
        estado_aprobacion: 'pendiente',
        tipo_aprobacion: 'pendiente',
        categoria: 'nomina',
      },
    ]);

    const r = await service.ingresosVsGastos(FINCA);

    expect(r.totalIngresos).toBe(1000000);
    expect(r.totalGastos).toBe(400000); // el pendiente no suma
    expect(r.balance).toBe(600000);
    expect(r.desglosePorCategoria).toEqual([
      { categoria: 'insumos', monto: 400000 },
    ]);
    expect(r.transacciones).toHaveLength(3); // pero sí se lista
  });

  describe('actividad', () => {
    const query = { pagina: 1, limite: 50 };

    it('mapea filas a entradas y arma la meta desde total_count', async () => {
      repo.actividad.mockResolvedValue([
        {
          tipo: 'venta_creada',
          descripcion: 'Registró una venta a Frigorífico X por 100000',
          entidad_id: 'venta-1',
          entidad_codigo: 'Frigorífico X',
          usuario_id: 'user-1',
          usuario_nombre: 'Dueño Test',
          usuario_rol: 'dueno_finca',
          fecha: new Date('2026-07-06T12:00:00Z'),
          total_count: '3',
        },
        {
          // animal_creado no tiene columna de usuario → usuario null
          tipo: 'animal_creado',
          descripcion: 'Registró el animal VACA-001',
          entidad_id: 'animal-1',
          entidad_codigo: 'VACA-001',
          usuario_id: null,
          usuario_nombre: null,
          usuario_rol: null,
          fecha: new Date('2026-07-05T09:00:00Z'),
          total_count: '3',
        },
      ] as never);

      const r = await service.actividad(FINCA, query as never);

      expect(repo.actividad).toHaveBeenCalledWith(
        FINCA,
        expect.objectContaining({ usuarioId: undefined, tipo: undefined }),
        1,
        50,
      );
      expect(r.datos).toHaveLength(2);
      expect(r.datos[0]).toMatchObject({
        tipo: 'venta_creada',
        entidadId: 'venta-1',
        entidadCodigo: 'Frigorífico X',
        usuario: { id: 'user-1', nombre: 'Dueño Test', rol: 'dueno_finca' },
      });
      // evento sin columna de usuario → usuario null (no un objeto vacío)
      expect(r.datos[1].usuario).toBeNull();
      // total viene de la window function, no del length de la página
      expect(r.meta.totalRegistros).toBe(3);
    });

    it('sin actividad → total 0 y datos vacíos', async () => {
      repo.actividad.mockResolvedValue([]);
      const r = await service.actividad(FINCA, query as never);
      expect(r.datos).toEqual([]);
      expect(r.meta.totalRegistros).toBe(0);
    });
  });

  describe('mortalidades', () => {
    it('mapea las filas SQL (snake_case) al shape camelCase de la respuesta', async () => {
      repo.mortalidades.mockResolvedValue([
        {
          animal_id: 'animal-1',
          codigo: 'VACA-001',
          categoria: 'vaca',
          fecha: '2026-07-01',
          causa: 'enfermedad',
        },
      ]);

      const r = await service.mortalidades(FINCA);

      expect(repo.mortalidades).toHaveBeenCalledWith(FINCA);
      expect(r).toEqual([
        {
          animalId: 'animal-1',
          codigo: 'VACA-001',
          categoria: 'vaca',
          fecha: '2026-07-01',
          causa: 'enfermedad',
        },
      ]);
    });
  });
});
