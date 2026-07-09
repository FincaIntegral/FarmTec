import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideCalendar, LucideUser, LucideSearch } from '@lucide/angular';
import { ReporteService, ActividadRegistroModel } from '../../core/services/reporte.service';
import { CardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [DatePipe, CardComponent, LucideCalendar, LucideUser, LucideSearch, FormsModule],
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
  readonly busqueda = signal('');
  readonly filtroTipo = signal<string | null>(null);

  readonly tiposFiltro = [
    { valor: null, label: 'Todos' },
    { valor: 'venta', label: 'Ventas' },
    { valor: 'gasto', label: 'Gastos' },
    { valor: 'reproduccion', label: 'Reproducción' },
    { valor: 'mortalidad', label: 'Mortalidad' },
    { valor: 'peso', label: 'Pesos' },
  ];

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

  readonly registrosFiltrados = computed(() => {
    const todos = this.registros();
    const busca = this.busqueda().toLowerCase();
    const tipo = this.filtroTipo();

    return todos.filter((r) => {
      const descLower = r.descripcion.toLowerCase();
      const cumpleBusca = !busca || descLower.includes(busca) || r.usuario?.nombre.toLowerCase().includes(busca);
      const cumpleTipo = !tipo || r.descripcion.toLowerCase().includes(tipo);
      return cumpleBusca && cumpleTipo;
    });
  });

  readonly agrupadoPorDia = computed(() => {
    const map = new Map<string, ActividadRegistroModel[]>();
    for (const registro of this.registrosFiltrados()) {
      const dia = registro.fecha.split('T')[0];
      if (!map.has(dia)) {
        map.set(dia, []);
      }
      map.get(dia)!.push(registro);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  });

  formatearDescripcion(desc: string): string {
    return desc.replace(/\b(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)\b/g, (match) => {
      const num = parseFloat(match.replace(/\./g, '').replace(',', '.'));
      if (isNaN(num) || num < 1000) return match;
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num);
    });
  }
}
