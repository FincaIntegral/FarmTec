import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { CategoriaAnimal } from '../../core/models/domain-types';
import { MortalidadRegistroModel } from '../../core/models/reporte';
import { ReporteService } from '../../core/services/reporte.service';
import { CardComponent } from '../../shared/components/card/card.component';

// Paleta para la torta de causas (colores fijos, no dependen del tema).
const PALETA = ['#a855f7', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#6b7280', '#ec4899', '#14b8a6'];

const CATEGORIA_LABEL: Record<CategoriaAnimal, string> = {
  toro: 'Toro',
  vaca: 'Vaca',
  becerro: 'Becerro',
};

@Component({
  selector: 'app-mortalidad',
  standalone: true,
  imports: [DecimalPipe, CardComponent],
  templateUrl: './mortalidad.component.html',
})
export class MortalidadComponent {
  private readonly reporteService = inject(ReporteService);

  readonly registros = signal<MortalidadRegistroModel[]>([]);
  readonly tasaMortalidad = signal<number>(0);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

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
    for (const r of this.registros()) {
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

  // ── Barras mensuales por categoría (becerros vs adultos), últimos 12 meses ──
  readonly barrasMensuales = computed(() => {
    const meses = this.ultimos12Meses();
    const buckets = new Map<string, { adultos: number; becerros: number }>();
    for (const m of meses) {
      buckets.set(m.key, { adultos: 0, becerros: 0 });
    }
    for (const r of this.registros()) {
      const b = buckets.get(r.fecha.slice(0, 7));
      if (!b) {
        continue; // fuera de la ventana de 12 meses
      }
      if (r.categoria === 'becerro') {
        b.becerros++;
      } else {
        b.adultos++;
      }
    }
    const max = Math.max(1, ...meses.map((m) => buckets.get(m.key)!.adultos + buckets.get(m.key)!.becerros));
    return meses.map((m) => {
      const b = buckets.get(m.key)!;
      return {
        label: m.label,
        adultos: b.adultos,
        becerros: b.becerros,
        total: b.adultos + b.becerros,
        adultosPct: (b.adultos / max) * 100,
        becerrosPct: (b.becerros / max) * 100,
      };
    });
  });

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
