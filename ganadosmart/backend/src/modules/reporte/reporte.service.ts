import { Injectable } from '@nestjs/common';
import { CategoriaGasto } from '../../shared/enums/categoria-gasto.enum';
import { GastoService } from '../gasto/gasto.service';
import { VentaService } from '../venta/venta.service';
import { ReporteRepository } from './reporte.repository';

const pct = (parte: number, total: number) =>
  total === 0 ? 0 : Math.round((parte / total) * 10000) / 100;

@Injectable()
export class ReporteService {
  constructor(
    private readonly reporteRepository: ReporteRepository,
    private readonly ventaService: VentaService,
    private readonly gastoService: GastoService,
  ) {}

  async dashboard(fincaId: string) {
    // Los pendientes del dashboard deben reflejar los vencimientos por tiempo
    await Promise.all([
      this.ventaService.aplicarVencimientos(fincaId),
      this.gastoService.aplicarVencimientos(fincaId),
    ]);

    const [hato, pesoPromedio, repro, muertes, pesajes, finanzas] =
      await Promise.all([
        this.reporteRepository.conteosHato(fincaId),
        this.reporteRepository.pesoPromedio(fincaId),
        this.reporteRepository.conteosReproduccion(fincaId),
        this.reporteRepository.muertes12Meses(fincaId),
        this.reporteRepository.pesajes7Dias(fincaId),
        this.reporteRepository.finanzasMesActual(fincaId),
      ]);

    const totalAnimales = parseInt(hato.total, 10);
    const vacas = parseInt(hato.vacas, 10);
    const partos = parseInt(repro.partos_exitosos_12m, 10);
    const ingresosMes = parseFloat(finanzas.ingresos_mes);
    const gastosMes = parseFloat(finanzas.gastos_mes);

    return {
      totalAnimales,
      vacas,
      toros: parseInt(hato.toros, 10),
      becerros: parseInt(hato.becerros, 10),
      pesoPromedio,
      // partos exitosos de los últimos 12 meses sobre vacas del hato
      tasaNatalidad: pct(partos, vacas),
      // muertes de los últimos 12 meses sobre el hato vivo + esas muertes
      tasaMortalidad: pct(muertes, totalAnimales + muertes),
      ingresosMes,
      gastosMes,
      balanceMes: ingresosMes - gastosMes,
      valorEstimadoHato: hato.valor_hato === null ? 0 : parseFloat(hato.valor_hato),
      pendientesAprobacion: parseInt(finanzas.pendientes, 10),
      porcentajeAutoAprobado: pct(
        parseInt(finanzas.auto_aprobadas, 10),
        parseInt(finanzas.total_transacciones, 10),
      ),
      actividadReciente: {
        pesosUltimos7Dias: pesajes,
        // sin tabla de eventos de salud: se reporta el nº de animales
        // actualmente en_tratamiento (ver historial-auditor.md)
        cambiosEstadoSalud: parseInt(hato.en_tratamiento, 10),
        inseminacionesRegistradas: parseInt(repro.inseminaciones_7d, 10),
        proximosAParto: parseInt(repro.proximos_a_parto, 10),
      },
      distribucionPorSexo: {
        machos: parseInt(hato.machos, 10),
        hembras: parseInt(hato.hembras, 10),
      },
    };
  }

  async ingresosVsGastos(
    fincaId: string,
    fechaInicio?: string,
    fechaFin?: string,
    categoria?: CategoriaGasto,
  ) {
    const filas = await this.reporteRepository.transacciones(
      fincaId,
      fechaInicio,
      fechaFin,
      categoria,
    );

    let totalIngresos = 0;
    let totalGastos = 0;
    const porCategoria = new Map<string, number>();

    for (const fila of filas) {
      if (fila.estado_aprobacion !== 'aprobado') {
        continue; // pendientes y rechazadas no suman al balance
      }
      const monto = parseFloat(fila.monto);
      if (fila.tipo === 'venta') {
        totalIngresos += monto;
      } else {
        totalGastos += monto;
        porCategoria.set(
          fila.categoria!,
          (porCategoria.get(fila.categoria!) ?? 0) + monto,
        );
      }
    }

    return {
      totalIngresos,
      totalGastos,
      balance: totalIngresos - totalGastos,
      desglosePorCategoria: [...porCategoria.entries()].map(
        ([cat, monto]) => ({ categoria: cat, monto }),
      ),
      transacciones: filas.map((f) => ({
        tipo: f.tipo,
        fecha: f.fecha,
        monto: parseFloat(f.monto),
        estado: f.estado_aprobacion,
        tipo_aprobacion: f.tipo_aprobacion,
      })),
    };
  }
}
