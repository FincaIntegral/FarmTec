import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucidePlus, LucideX } from '@lucide/angular';
import { AuthService } from '../../../core/auth/auth.service';
import { CategoriaGasto, EstadoAprobacion } from '../../../core/models/domain-types';
import { GastoDetailModel } from '../../../core/models/gasto';
import { GastoService } from '../../../core/services/gasto.service';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { CardComponent } from '../../../shared/components/card/card.component';

type FiltroCategoria = 'Todos' | CategoriaGasto;

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

const CATEGORIA_LABEL: Record<CategoriaGasto, string> = {
  insumos: 'Insumos',
  nomina: 'Nómina',
  veterinario: 'Veterinario',
  otro: 'Otro',
};

const CATEGORIA_COLOR: Record<CategoriaGasto, string> = {
  insumos: 'bg-amber-500',
  nomina: 'bg-blue-500',
  veterinario: 'bg-purple-500',
  otro: 'bg-gray-400',
};

const CATEGORIAS: CategoriaGasto[] = ['insumos', 'nomina', 'veterinario', 'otro'];

@Component({
  selector: 'app-gastos-registro',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, CardComponent, BadgeComponent, LucidePlus, LucideX],
  templateUrl: './registro.component.html',
})
export class RegistroComponent {
  private readonly gastoService = inject(GastoService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly gastos = signal<GastoDetailModel[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly filtroCategoria = signal<FiltroCategoria>('Todos');
  readonly pagina = signal(1);
  readonly totalPaginas = signal(1);
  readonly totalRegistros = signal(0);

  readonly filtrosCategoria: FiltroCategoria[] = ['Todos', ...CATEGORIAS];
  readonly categorias = CATEGORIAS;

  readonly esDueno = computed(() => this.authService.usuario()?.rol === 'dueno_finca');

  // Fuente del gráfico: un lote de hasta 100 gastos (todas las categorías y
  // estados) que se agrega client-side por categoría.
  // ponytail: 100 alcanza para el piloto; si crece, usar un agregado del server
  // (GET /reportes/ingresos-vs-gastos ya devuelve desglosePorCategoria).
  readonly todosLosGastos = signal<GastoDetailModel[]>([]);

  readonly gastosPorCategoria = computed(() => {
    const totales = new Map<CategoriaGasto, number>();
    for (const g of this.todosLosGastos()) {
      totales.set(g.categoria, (totales.get(g.categoria) ?? 0) + g.monto);
    }
    const max = Math.max(1, ...Array.from(totales.values()));
    return CATEGORIAS.map((c) => {
      const total = totales.get(c) ?? 0;
      return {
        categoria: c,
        label: CATEGORIA_LABEL[c],
        color: CATEGORIA_COLOR[c],
        total,
        pct: Math.round((total / max) * 100),
      };
    });
  });

  readonly mostrarModalCrear = signal(false);
  readonly creando = signal(false);
  readonly errorCrear = signal<string | null>(null);

  readonly formCrear = this.fb.nonNullable.group({
    categoria: ['insumos' as CategoriaGasto, Validators.required],
    monto: [0, [Validators.required, Validators.min(0.01)]],
    descripcion: [''],
    fecha: [this.hoy(), Validators.required],
  });

  readonly mostrarModalRechazar = signal(false);
  readonly gastoRechazar = signal<GastoDetailModel | null>(null);
  readonly rechazando = signal(false);
  readonly errorRechazar = signal<string | null>(null);
  readonly formRechazar = this.fb.nonNullable.group({
    motivo: [''],
  });

  readonly aprobandoId = signal<string | null>(null);
  readonly errorAprobar = signal<string | null>(null);

  constructor() {
    this.cargar();
    this.cargarGrafico();
  }

  categoriaLabel(categoria: CategoriaGasto): string {
    return CATEGORIA_LABEL[categoria];
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
    const filtro = this.filtroCategoria();
    const categoria: CategoriaGasto | undefined = filtro === 'Todos' ? undefined : filtro;

    this.gastoService.listar({ categoria, pagina: this.pagina(), limite: 20 }).subscribe({
      next: (resp) => {
        this.gastos.set(resp.datos);
        this.totalPaginas.set(resp.meta.totalPaginas);
        this.totalRegistros.set(resp.meta.totalRegistros);
        this.cargando.set(false);
      },
      error: (err: { message?: string }) => {
        this.error.set(err?.message ?? 'No se pudo cargar el historial de gastos');
        this.cargando.set(false);
      },
    });
  }

  private cargarGrafico(): void {
    this.gastoService.listar({ limite: 100 }).subscribe((resp) => this.todosLosGastos.set(resp.datos));
  }

  onFiltroCategoria(filtro: FiltroCategoria): void {
    this.filtroCategoria.set(filtro);
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
    this.formCrear.reset({ categoria: 'insumos', monto: 0, descripcion: '', fecha: this.hoy() });
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
    this.gastoService
      .crear({
        categoria: valores.categoria,
        monto: valores.monto,
        descripcion: valores.descripcion || undefined,
        fecha: valores.fecha,
      })
      .subscribe({
        next: () => {
          this.creando.set(false);
          this.mostrarModalCrear.set(false);
          this.pagina.set(1);
          this.cargar();
          this.cargarGrafico();
        },
        error: (err: { message?: string }) => {
          this.creando.set(false);
          this.errorCrear.set(err?.message ?? 'No se pudo registrar el gasto');
        },
      });
  }

  aprobar(gasto: GastoDetailModel): void {
    this.aprobandoId.set(gasto.id);
    this.errorAprobar.set(null);
    this.gastoService.aprobar(gasto.id).subscribe({
      next: () => {
        this.aprobandoId.set(null);
        this.cargar();
      },
      error: (err: { message?: string }) => {
        this.aprobandoId.set(null);
        this.errorAprobar.set(err?.message ?? 'No se pudo aprobar el gasto');
      },
    });
  }

  abrirModalRechazar(gasto: GastoDetailModel): void {
    this.gastoRechazar.set(gasto);
    this.formRechazar.reset({ motivo: '' });
    this.errorRechazar.set(null);
    this.mostrarModalRechazar.set(true);
  }

  cerrarModalRechazar(): void {
    this.mostrarModalRechazar.set(false);
  }

  rechazar(): void {
    const gasto = this.gastoRechazar();
    if (!gasto) {
      return;
    }
    this.rechazando.set(true);
    this.errorRechazar.set(null);
    const valores = this.formRechazar.getRawValue();
    this.gastoService.rechazar(gasto.id, { motivo: valores.motivo || undefined }).subscribe({
      next: () => {
        this.rechazando.set(false);
        this.mostrarModalRechazar.set(false);
        this.cargar();
      },
      error: (err: { message?: string }) => {
        this.rechazando.set(false);
        this.errorRechazar.set(err?.message ?? 'No se pudo rechazar el gasto');
      },
    });
  }

  private hoy(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
