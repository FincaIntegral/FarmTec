import { Component, computed, inject, signal } from '@angular/core';
import { IngresosVsGastosModel, ReporteService, TransaccionModel } from '../../../../core/services/reporte.service';

const FORMATO_MONEDA = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const MESES_COUNT = 6;

@Component({
  selector: 'app-financial-chart',
  standalone: true,
  templateUrl: './financial-chart.component.html',
})
export class FinancialChartComponent {
  private readonly reporteService = inject(ReporteService);

  private readonly transacciones = signal<TransaccionModel[]>([]);

  constructor() {
    const now = new Date();
    const inicio = new Date(now.getFullYear(), now.getMonth() - (MESES_COUNT - 1), 1);
    const fechaInicio = `${inicio.getFullYear()}-${this.pad(inicio.getMonth() + 1)}-01`;
    this.reporteService.ingresosVsGastos(fechaInicio).subscribe({
      next: (r: IngresosVsGastosModel) => this.transacciones.set(r.transacciones),
      error: () => {},
    });
  }

  private pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  // Ingresos/gastos aprobados agrupados por los últimos meses.
  readonly barras = computed(() => {
    const meses: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = MESES_COUNT - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      meses.push({
        key: `${d.getFullYear()}-${this.pad(d.getMonth() + 1)}`,
        label: d.toLocaleDateString('es', { month: 'short' }),
      });
    }

    const buckets = new Map<string, { ingresos: number; gastos: number }>();
    for (const m of meses) buckets.set(m.key, { ingresos: 0, gastos: 0 });
    for (const t of this.transacciones()) {
      if (t.estado !== 'aprobado') continue;
      const b = buckets.get(t.fecha.slice(0, 7));
      if (!b) continue;
      if (t.tipo === 'venta') b.ingresos += t.monto;
      else b.gastos += t.monto;
    }

    const max = Math.max(1, ...meses.map((m) => {
      const b = buckets.get(m.key)!;
      return Math.max(b.ingresos, b.gastos);
    }));

    return meses.map((m) => {
      const b = buckets.get(m.key)!;
      return {
        label: m.label,
        ingresos: b.ingresos,
        gastos: b.gastos,
        ingresosPct: (b.ingresos / max) * 100,
        gastosPct: (b.gastos / max) * 100,
        ingresosFmt: FORMATO_MONEDA.format(b.ingresos),
        gastosFmt: FORMATO_MONEDA.format(b.gastos),
      };
    });
  });

  readonly balance = computed(() => this.barras().reduce((s, b) => s + b.ingresos - b.gastos, 0));
  readonly balanceFormato = computed(() => FORMATO_MONEDA.format(this.balance()));
}
