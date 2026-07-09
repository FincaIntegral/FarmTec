import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucidePlus, LucideX } from '@lucide/angular';
import { AuthService } from '../../../core/auth/auth.service';
import { AnimalSummaryModel } from '../../../core/models/animal';
import { EstadoAprobacion } from '../../../core/models/domain-types';
import { VentaDetailModel } from '../../../core/models/venta';
import { AnimalService } from '../../../core/services/animal.service';
import { VentaService } from '../../../core/services/venta.service';
import { FormatCurrencyPipe } from '../../../core/pipes/format-currency.pipe';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { CardComponent } from '../../../shared/components/card/card.component';

type FiltroEstado = 'Todos' | EstadoAprobacion;

const ESTADO_VARIANT: Record<EstadoAprobacion, BadgeVariant> = {
  pendiente: 'yellow',
  aprobado: 'green',
  rechazado: 'red',
};

const ESTADO_LABEL: Record<EstadoAprobacion, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

@Component({
  selector: 'app-ventas-registro',
  standalone: true,
  imports: [ReactiveFormsModule, FormatCurrencyPipe, CardComponent, BadgeComponent, LucidePlus, LucideX],
  templateUrl: './registro.component.html',
})
export class RegistroComponent {
  private readonly ventaService = inject(VentaService);
  private readonly animalService = inject(AnimalService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly ventas = signal<VentaDetailModel[]>([]);
  readonly animales = signal<AnimalSummaryModel[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly filtroEstado = signal<FiltroEstado>('Todos');
  readonly pagina = signal(1);
  readonly totalPaginas = signal(1);
  readonly totalRegistros = signal(0);

  readonly filtrosEstado: FiltroEstado[] = ['Todos', 'pendiente', 'aprobado', 'rechazado'];

  readonly animalesVendibles = computed(() =>
    this.animales().filter((a) => a.estado === 'activo' || a.estado === 'en_tratamiento'),
  );

  readonly esDueno = computed(() => this.authService.usuario()?.rol === 'dueno_finca');

  readonly mostrarModalCrear = signal(false);
  readonly creando = signal(false);
  readonly errorCrear = signal<string | null>(null);

  readonly formCrear = this.fb.nonNullable.group({
    animalId: [''],
    comprador: ['', Validators.required],
    monto: [0, [Validators.required, Validators.min(0.01)]],
    fecha: [this.hoy(), Validators.required],
  });

  readonly mostrarModalRechazar = signal(false);
  readonly ventaRechazar = signal<VentaDetailModel | null>(null);
  readonly rechazando = signal(false);
  readonly errorRechazar = signal<string | null>(null);
  readonly formRechazar = this.fb.nonNullable.group({
    motivo: [''],
  });

  readonly aprobandoId = signal<string | null>(null);
  readonly errorAprobar = signal<string | null>(null);

  constructor() {
    this.cargar();
    this.animalService.listar({ limite: 100 }).subscribe((resp) => this.animales.set(resp.datos));
  }

  codigoAnimal(id: string | null): string {
    if (!id) {
      return '—';
    }
    return this.animales().find((a) => a.id === id)?.codigo ?? id;
  }

  estadoVariant(estado: EstadoAprobacion): BadgeVariant {
    return ESTADO_VARIANT[estado];
  }

  estadoLabel(estado: EstadoAprobacion): string {
    return ESTADO_LABEL[estado];
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    const filtro = this.filtroEstado();
    const estadoAprobacion: EstadoAprobacion | undefined = filtro === 'Todos' ? undefined : filtro;

    this.ventaService.listar({ estadoAprobacion, pagina: this.pagina(), limite: 20 }).subscribe({
      next: (resp) => {
        this.ventas.set(resp.datos);
        this.totalPaginas.set(resp.meta.totalPaginas);
        this.totalRegistros.set(resp.meta.totalRegistros);
        this.cargando.set(false);
      },
      error: (err: { message?: string }) => {
        this.error.set(err?.message ?? 'No se pudo cargar el historial de ventas');
        this.cargando.set(false);
      },
    });
  }

  onFiltroEstado(filtro: FiltroEstado): void {
    this.filtroEstado.set(filtro);
    this.pagina.set(1);
    this.cargar();
  }

  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) {
      return;
    }
    this.pagina.set(pagina);
    this.cargar();
  }

  abrirModalCrear(): void {
    this.formCrear.reset({ animalId: '', comprador: '', monto: 0, fecha: this.hoy() });
    this.errorCrear.set(null);
    this.mostrarModalCrear.set(true);
  }

  cerrarModalCrear(): void {
    this.mostrarModalCrear.set(false);
  }

  crear(): void {
    if (this.formCrear.invalid) {
      this.formCrear.markAllAsTouched();
      return;
    }
    this.creando.set(true);
    this.errorCrear.set(null);
    const valores = this.formCrear.getRawValue();
    this.ventaService
      .crear({
        animalId: valores.animalId || undefined,
        comprador: valores.comprador,
        monto: valores.monto,
        fecha: valores.fecha,
      })
      .subscribe({
        next: () => {
          this.creando.set(false);
          this.mostrarModalCrear.set(false);
          this.pagina.set(1);
          this.cargar();
        },
        error: (err: { message?: string }) => {
          this.creando.set(false);
          this.errorCrear.set(err?.message ?? 'No se pudo registrar la venta');
        },
      });
  }

  aprobar(venta: VentaDetailModel): void {
    this.aprobandoId.set(venta.id);
    this.errorAprobar.set(null);
    this.ventaService.aprobar(venta.id).subscribe({
      next: () => {
        this.aprobandoId.set(null);
        this.cargar();
      },
      error: (err: { message?: string }) => {
        this.aprobandoId.set(null);
        this.errorAprobar.set(err?.message ?? 'No se pudo aprobar la venta');
      },
    });
  }

  abrirModalRechazar(venta: VentaDetailModel): void {
    this.ventaRechazar.set(venta);
    this.formRechazar.reset({ motivo: '' });
    this.errorRechazar.set(null);
    this.mostrarModalRechazar.set(true);
  }

  cerrarModalRechazar(): void {
    this.mostrarModalRechazar.set(false);
  }

  rechazar(): void {
    const venta = this.ventaRechazar();
    if (!venta) {
      return;
    }
    this.rechazando.set(true);
    this.errorRechazar.set(null);
    const valores = this.formRechazar.getRawValue();
    this.ventaService.rechazar(venta.id, { motivo: valores.motivo || undefined }).subscribe({
      next: () => {
        this.rechazando.set(false);
        this.mostrarModalRechazar.set(false);
        this.cargar();
      },
      error: (err: { message?: string }) => {
        this.rechazando.set(false);
        this.errorRechazar.set(err?.message ?? 'No se pudo rechazar la venta');
      },
    });
  }

  private hoy(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
