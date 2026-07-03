import { Component, computed, input } from '@angular/core';

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
  readonly historial = input.required<PuntoHistorial[]>();

  readonly viewBox = `0 0 ${ANCHO} ${ALTO}`;
  readonly lineaMediaY = ALTO / 2;

  readonly ordenado = computed(() => [...this.historial()].sort((a, b) => a.fecha.localeCompare(b.fecha)));

  readonly puntosSvg = computed(() => {
    const datos = this.ordenado();
    if (datos.length === 0) {
      return [];
    }

    const pesos = datos.map((d) => d.pesoKg);
    const min = Math.min(...pesos);
    const max = Math.max(...pesos);
    const rango = max - min || 1;

    const anchoUtil = ANCHO - PADDING * 2;
    const altoUtil = ALTO - PADDING * 2;

    return datos.map((d, i) => {
      const x = datos.length === 1 ? ANCHO / 2 : PADDING + (i / (datos.length - 1)) * anchoUtil;
      const y = PADDING + altoUtil - ((d.pesoKg - min) / rango) * altoUtil;
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
}
