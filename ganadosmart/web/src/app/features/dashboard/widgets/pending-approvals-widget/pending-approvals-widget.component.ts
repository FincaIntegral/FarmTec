import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GastoService } from '../../../../core/services/gasto.service';
import { VentaService } from '../../../../core/services/venta.service';

@Component({
  selector: 'app-pending-approvals-widget',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pending-approvals-widget.component.html',
})
export class PendingApprovalsWidgetComponent {
  private readonly ventaService = inject(VentaService);
  private readonly gastoService = inject(GastoService);

  readonly ventasCount = signal(0);
  readonly gastosCount = signal(0);
  readonly total = computed(() => this.ventasCount() + this.gastosCount());

  constructor() {
    // Solo necesitamos el conteo: pedimos 1 y leemos el total de la paginación.
    this.ventaService.listar({ estadoAprobacion: 'pendiente', limite: 1 }).subscribe({
      next: (r) => this.ventasCount.set(r.meta.totalRegistros),
      error: () => {},
    });
    this.gastoService.listar({ estadoAprobacion: 'pendiente', limite: 1 }).subscribe({
      next: (r) => this.gastosCount.set(r.meta.totalRegistros),
      error: () => {},
    });
  }
}
