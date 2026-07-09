import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { CategoriaAnimal } from '../../core/models/domain-types';
import { MortalidadRegistroModel } from '../../core/models/reporte';
import { ReporteService } from '../../core/services/reporte.service';
import { BadgeComponent, BadgeVariant } from '../../shared/components/badge/badge.component';
import { CardComponent } from '../../shared/components/card/card.component';

// Paleta para la torta de causas (colores fijos, no dependen del tema).
const PALETA = ['#a855f7', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#6b7280', '#ec4899', '#14b8a6'];

const CATEGORIA_LABEL: Record<CategoriaAnimal, string> = {
  toro: 'Toro',
  vaca: 'Vaca',
  becerro: 'Becerro',
};

const CATEGORIA_VARIANT: Record<CategoriaAnimal, BadgeVariant> = {
  becerro: 'yellow',
  vaca: 'blue',
  toro: 'purple',
};

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

@Component({
  selector: 'app-mortalidad',
  standalone: true,
  imports: [DecimalPipe, CardComponent, BadgeComponent],
  templateUrl: './mortalidad.component.html',
})
export class MortalidadComponent {
  private readonly reporteService = inject(ReporteService);

  readonly registros = signal<MortalidadRegistroModel[]>([]);
  readonly tasaMortalidad = signal<number>(0);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly filtroCategoria = signal<'todos' | 'adultos' | 'becerros'>('todos');

  readonly meses = MESES;
  readonly anioSel = signal<number | 'todos'>('todos');
  readonly mesSel = signal<number | 'todos'>('todos');

  // Años presentes en los registros, descendente.
  readonly anios = computed(() => {
    const set = new Set<number>();
    for (const r of this.registros()) set.add(+r.fecha.slice(0, 4));
    return Array.from(set).sort((a, b) => b - a);
  });

  // fecha es 'YYYY-MM-DD' — comparamos por string para evitar líos de zona horaria.
  readonly registrosFiltrados = computed(() => {
    const a = this.anioSel();
    const m = this.mesSel();
    return this.registros().filter((r) => {
      if (a !== 'todos' && +r.fecha.slice(0, 4) !== a) return false;
      if (m !== 'todos' && +r.fecha.slice(5, 7) !== m) return false;
      return true;
    });
  });

  setAnio(valor: string): void {
    this.anioSel.set(valor === 'todos' ? 'todos' : +valor);
  }

  setMes(valor: string): void {
    this.mesSel.set(valor === 'todos' ? 'todos' : +valor);
  }

  constructor() {
    this.reporteService.dashboard().subscribe({
      next: (d) => this.tasaMortalidad.set(d.tasaMortalidad),
      error: () => {
        /* la tasa es secundaria: si falla el dashboard, el resto igual sirve */
      },
    });
    this.reporteService.mortalidad().subscribe({
      next: (regs) => {
        this.registros.set(regs);
        this.cargando.set(false);
      },
      error: (err: { message?: string }) => {
        this.error.set(err?.message ?? 'No se pudo cargar la mortalidad');
        this.cargando.set(false);
      },
    });
  }

  categoriaLabel(c: CategoriaAnimal): string {
    return CATEGORIA_LABEL[c];
  }

  categoriaVariant(c: CategoriaAnimal): BadgeVariant {
    return CATEGORIA_VARIANT[c];
  }

  setFiltroCategoria(valor: 'todos' | 'adultos' | 'becerros'): void {
    this.filtroCategoria.set(valor);
  }

  // ── KPIs ──
  readonly muertes12m = computed(() => this.registros().filter((r) => this.enVentana(r.fecha, 0, 12)).length);
  private readonly muertes12mPrevio = computed(
    () => this.registros().filter((r) => this.enVentana(r.fecha, 12, 24)).length,
  );

  readonly variacion = computed(() => {
    const prev = this.muertes12mPrevio();
    const act = this.muertes12m();
    if (prev === 0) {
      return act === 0 ? 0 : 100;
    }
    return Math.round(((act - prev) / prev) * 100);
  });

  // ── Torta de causas (todo el histórico) ──
  readonly causas = computed(() => {
    const counts = new Map<string, number>();
    for (const r of this.registrosFiltrados()) {
      counts.set(r.causa, (counts.get(r.causa) ?? 0) + 1);
    }
    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
    const ordenadas = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    let acc = 0;
    return ordenadas.map(([causa, count], i) => {
      const from = total === 0 ? 0 : (acc / total) * 100;
      acc += count;
      const to = total === 0 ? 0 : (acc / total) * 100;
      return {
        causa,
        count,
        pct: total === 0 ? 0 : Math.round((count / total) * 100),
        color: PALETA[i % PALETA.length],
        from,
        to,
      };
    });
  });

  readonly causaPrincipal = computed(() => this.causas()[0]?.causa ?? '—');

  readonly pieGradient = computed(() => {
    const segs = this.causas();
    if (segs.length === 0) {
      return 'var(--muted)';
    }
    return `conic-gradient(${segs.map((s) => `${s.color} ${s.from}% ${s.to}%`).join(', ')})`;
  });

  // ── Barras mensuales por causa (con categoría) ──
  readonly barrasMensuales = computed(() => {
    const meses = this.mesesGrafica();
    const mesBuckets = new Map<string, Map<string, { adultos: number; becerros: number }>>();
    const todasLasCausas = new Set<string>();

    for (const m of meses) {
      mesBuckets.set(m.key, new Map());
    }
    for (const r of this.registrosFiltrados()) {
      const mesBucket = mesBuckets.get(r.fecha.slice(0, 7));
      if (!mesBucket) continue;
      todasLasCausas.add(r.causa);
      if (!mesBucket.has(r.causa)) {
        mesBucket.set(r.causa, { adultos: 0, becerros: 0 });
      }
      const causaBucket = mesBucket.get(r.causa)!;
      if (r.categoria === 'becerro') {
        causaBucket.becerros++;
      } else {
        causaBucket.adultos++;
      }
    }

    const causasOrdenadas = Array.from(todasLasCausas).sort();
    const causaColorMap = new Map<string, string>();
    causasOrdenadas.forEach((causa, i) => {
      causaColorMap.set(causa, PALETA[i % PALETA.length]);
    });

    const filtro = this.filtroCategoria();

    // Calcular maxTotal con el filtro aplicado
    const maxTotal = Math.max(
      1,
      ...meses.map((m) => {
        const bucket = mesBuckets.get(m.key)!;
        return Array.from(bucket.values()).reduce((sum, b) => {
          let a = b.adultos, be = b.becerros;
          if (filtro === 'adultos') be = 0;
          if (filtro === 'becerros') a = 0;
          return sum + a + be;
        }, 0);
      }),
    );

    return meses.map((m) => {
      const mesBucket = mesBuckets.get(m.key)!;

      const barras = causasOrdenadas.map((causa) => {
        const causeData = mesBucket.get(causa) ?? { adultos: 0, becerros: 0 };
        let adultos = causeData.adultos;
        let becerros = causeData.becerros;

        if (filtro === 'adultos') becerros = 0;
        if (filtro === 'becerros') adultos = 0;

        const total = adultos + becerros;
        const filteredTotal = Array.from(mesBucket.values()).reduce((sum, b) => {
          let a = b.adultos, be = b.becerros;
          if (filtro === 'adultos') be = 0;
          if (filtro === 'becerros') a = 0;
          return sum + a + be;
        }, 0);

        return {
          causa,
          adultos,
          becerros,
          total,
          adultosPct: filteredTotal > 0 ? (adultos / filteredTotal) * 100 : 0,
          becerrosPct: filteredTotal > 0 ? (becerros / filteredTotal) * 100 : 0,
          color: causaColorMap.get(causa)!,
        };
      });

      const filteredTotal = barras.reduce((sum, b) => sum + b.total, 0);
      return {
        label: m.label,
        barras: barras.filter((b) => b.total > 0),
        total: filteredTotal,
        heightPct: (filteredTotal / maxTotal) * 100,
      };
    });
  });

  // Meses que muestra la gráfica según el filtro año/mes.
  // Año elegido → sus 12 meses (o solo el mes elegido); sin año → últimos 12 meses.
  private mesesGrafica(): { key: string; label: string }[] {
    const anio = this.anioSel();
    const mes = this.mesSel();
    if (anio === 'todos') {
      return this.ultimos12Meses();
    }
    const desde = mes === 'todos' ? 1 : mes;
    const hasta = mes === 'todos' ? 12 : mes;
    const out: { key: string; label: string }[] = [];
    for (let m = desde; m <= hasta; m++) {
      const d = new Date(anio, m - 1, 1);
      out.push({
        key: `${anio}-${String(m).padStart(2, '0')}`,
        label: d.toLocaleDateString('es', { month: 'short' }),
      });
    }
    return out;
  }

  private ultimos12Meses(): { key: string; label: string }[] {
    const out: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      out.push({ key, label: d.toLocaleDateString('es', { month: 'short' }) });
    }
    return out;
  }

  // fecha dentro de (hoy - hasta·meses, hoy - desde·meses]
  private enVentana(fecha: string, desde: number, hasta: number): boolean {
    const f = new Date(fecha);
    const now = new Date();
    const reciente = new Date(now.getFullYear(), now.getMonth() - desde, now.getDate());
    const lejano = new Date(now.getFullYear(), now.getMonth() - hasta, now.getDate());
    return f > lejano && f <= reciente;
  }
}
