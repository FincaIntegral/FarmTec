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
});
