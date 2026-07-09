import { Component, computed, input, signal } from '@angular/core';

interface PuntoHistorial {
  pesoKg: number;
  fecha: string;
}

const ANCHO = 600;
const ALTO = 160;
const PADDING = 24;

@Component({
  selector: 'app-peso-history-chart',
  standalone: true,
  templateUrl: './peso-history-chart.component.html',
})
export class PesoHistoryChartComponent {
  readonly ALTO = ALTO;
  readonly historial = input.required<PuntoHistorial[]>();
  readonly puntoHovereado = signal<{ x: number; y: number; pesoKg: number; fecha: string } | null>(null);

  readonly viewBox = `0 0 ${ANCHO} ${ALTO}`;
  readonly lineaMediaY = ALTO / 2;

  readonly ordenado = computed(() => [...this.historial()].sort((a, b) => a.fecha.localeCompare(b.fecha)));

  readonly minMax = computed(() => {
    const pesos = this.ordenado().map((d) => d.pesoKg);
    const min = Math.min(...pesos);
    const max = Math.max(...pesos);
    const rango = max - min || 1;
    return { min: Math.floor(min - rango * 0.1), max: Math.ceil(max + rango * 0.1), rango };
  });

  readonly puntosSvg = computed(() => {
    const datos = this.ordenado();
    if (datos.length === 0) {
      return [];
    }

    const { min, max, rango } = this.minMax();
    const actualRango = max - min;

    const anchoUtil = ANCHO - PADDING * 2;
    const altoUtil = ALTO - PADDING * 2;

    return datos.map((d, i) => {
      const x = datos.length === 1 ? ANCHO / 2 : PADDING + (i / (datos.length - 1)) * anchoUtil;
      const y = PADDING + altoUtil - ((d.pesoKg - min) / actualRango) * altoUtil;
      return { x, y, pesoKg: d.pesoKg, fecha: d.fecha };
    });
  });

  readonly lineaPath = computed(() => {
    const puntos = this.puntosSvg();
    if (puntos.length === 0) {
      return '';
    }
    return puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  });

  onMouseMove(event: MouseEvent): void {
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (600 / rect.width);

    const puntos = this.puntosSvg();
    if (puntos.length === 0) return;

    const masCercano = puntos.reduce((prev, curr) =>
      Math.abs(curr.x - x) < Math.abs(prev.x - x) ? curr : prev
    );

    this.puntoHovereado.set(masCercano);
  }

  onMouseLeave(): void {
    this.puntoHovereado.set(null);
  }
}
