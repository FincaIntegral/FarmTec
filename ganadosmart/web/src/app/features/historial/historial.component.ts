import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideCalendar, LucideUser } from '@lucide/angular';
import { ReporteService, ActividadRegistroModel } from '../../core/services/reporte.service';
import { CardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [DatePipe, CardComponent, LucideCalendar, LucideUser],
  templateUrl: './historial.component.html',
})
export class HistorialComponent {
  private readonly reporteService = inject(ReporteService);

  readonly registros = signal<ActividadRegistroModel[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly pagina = signal(1);
  readonly totalPaginas = signal(1);
  readonly totalRegistros = signal(0);

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.reporteService.actividad({ pagina: this.pagina(), limite: 50 }).subscribe({
      next: (resp) => {
        this.registros.set(resp.datos);
        this.totalPaginas.set(resp.meta.totalPaginas);
        this.totalRegistros.set(resp.meta.totalRegistros);
        this.cargando.set(false);
      },
      error: (err: { message?: string }) => {
        this.error.set(err?.message ?? 'No se pudo cargar el historial de actividad');
        this.cargando.set(false);
      },
    });
  }

  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) {
      return;
    }
    this.pagina.set(pagina);
    this.cargar();
  }

  agrupadoPorDia = computed(() => {
    const map = new Map<string, ActividadRegistroModel[]>();
    for (const registro of this.registros()) {
      const dia = registro.fecha.split('T')[0];
      if (!map.has(dia)) {
        map.set(dia, []);
      }
      map.get(dia)!.push(registro);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  });
}
