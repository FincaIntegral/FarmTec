import { Component, computed, inject, signal } from '@angular/core';
import { AnimalSummaryModel } from '../../../../core/models/animal';
import { AnimalService } from '../../../../core/services/animal.service';

const MESES_COUNT = 12;

@Component({
  selector: 'app-herd-growth-chart',
  standalone: true,
  templateUrl: './herd-growth-chart.component.html',
})
export class HerdGrowthChartComponent {
  private readonly animalService = inject(AnimalService);

  private readonly animales = signal<AnimalSummaryModel[]>([]);

  constructor() {
    // ponytail: hato piloto < 100; si crece, paginar con meta.totalPaginas.
    this.animalService.listar({ limite: 100 }).subscribe({
      next: (r) => this.animales.set(r.datos),
      error: () => {},
    });
  }

  // Acumulado de animales por sexo hasta el fin de cada mes (alta = nacimiento o compra).
  readonly barras = computed(() => {
    const meses: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = MESES_COUNT - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      meses.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('es', { month: 'short' }),
      });
    }

    const anim = this.animales();
    const puntos = meses.map((m) => {
      let machos = 0;
      let hembras = 0;
      for (const a of anim) {
        // createdAt 'YYYY-MM-DD...' — comparación lexical por mes.
        if (a.createdAt.slice(0, 7) <= m.key) {
          if (a.sexo === 'macho') machos++;
          else hembras++;
        }
      }
      return { label: m.label, machos, hembras, total: machos + hembras };
    });

    const max = Math.max(1, ...puntos.map((p) => p.total));
    return puntos.map((p) => ({
      ...p,
      heightPct: (p.total / max) * 100,
      machosPct: p.total > 0 ? (p.machos / p.total) * 100 : 0,
      hembrasPct: p.total > 0 ? (p.hembras / p.total) * 100 : 0,
    }));
  });

  readonly totalActual = computed(() => this.barras()[this.barras().length - 1]?.total ?? 0);
}
