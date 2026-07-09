import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import {
  LucideBeef,
  LucideHeart,
  LucideRefreshCw,
  LucideScale,
  LucideSkull,
  LucideTag,
  LucideTrendingUp,
} from '@lucide/angular';
import { DashboardModel } from '../../core/models/reporte';
import { ReporteService } from '../../core/services/reporte.service';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { DotComponent } from '../../shared/components/dot/dot.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';
import { FinancialChartComponent } from './widgets/financial-chart/financial-chart.component';
import { PendingApprovalsWidgetComponent } from './widgets/pending-approvals-widget/pending-approvals-widget.component';

const FORMATO_MONEDA = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CardComponent,
    KpiCardComponent,
    SectionHeaderComponent,
    DotComponent,
    BadgeComponent,
    FinancialChartComponent,
    PendingApprovalsWidgetComponent,
    LucideRefreshCw,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly reporteService = inject(ReporteService);

  protected readonly iconAnimales = LucideBeef.icon;
  protected readonly iconBecerros = LucideTag.icon;
  protected readonly iconPeso = LucideScale.icon;
  protected readonly iconNatalidad = LucideHeart.icon;
  protected readonly iconMortalidad = LucideSkull.icon;
  protected readonly iconIngresos = LucideTrendingUp.icon;

  readonly datos = signal<DashboardModel | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly hora = signal(this.horaActual());

  readonly pesoPromedioTexto = computed(() => {
    const p = this.datos()?.pesoPromedio;
    return p !== null && p !== undefined ? `${Math.round(p)} kg` : '—';
  });

  readonly ingresosFormato = computed(() => FORMATO_MONEDA.format(this.datos()?.ingresosMes ?? 0));

  private intervalo?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.cargar();
    this.intervalo = setInterval(() => this.hora.set(this.horaActual()), 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.reporteService.dashboard().subscribe({
      next: (d) => {
        this.datos.set(d);
        this.cargando.set(false);
      },
      error: (err: { message?: string }) => {
        this.error.set(err?.message ?? 'No se pudo cargar el dashboard');
        this.cargando.set(false);
      },
    });
  }

  private horaActual(): string {
    return new Date().toLocaleTimeString('es-CO');
  }
}
