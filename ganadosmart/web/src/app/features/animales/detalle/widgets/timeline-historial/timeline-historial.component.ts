import { Component, computed, input } from '@angular/core';
import { LucideCheck } from '@lucide/angular';

interface PuntoHistorial {
  pesoKg: number;
  fecha: string;
}

@Component({
  selector: 'app-timeline-historial',
  standalone: true,
  imports: [LucideCheck],
  templateUrl: './timeline-historial.component.html',
})
export class TimelineHistorialComponent {
  readonly historial = input.required<PuntoHistorial[]>();

  readonly eventos = computed(() => [...this.historial()].sort((a, b) => b.fecha.localeCompare(a.fecha)));
}
