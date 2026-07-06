import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideMapPin, LucidePlus, LucideX } from '@lucide/angular';
import { AuthService } from '../../../core/auth/auth.service';
import { EstadoPotrero } from '../../../core/models/domain-types';
import { PotreroSummaryModel } from '../../../core/models/potrero';
import { PotreroService } from '../../../core/services/potrero.service';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { CardComponent } from '../../../shared/components/card/card.component';

const ESTADO_VARIANT: Record<EstadoPotrero, BadgeVariant> = {
  en_uso: 'green',
  disponible: 'sky',
  descanso: 'yellow',
  mantenimiento: 'orange',
};

const ESTADO_LABEL: Record<EstadoPotrero, string> = {
  en_uso: 'En uso',
  disponible: 'Disponible',
  descanso: 'Descanso',
  mantenimiento: 'Mantenimiento',
};

@Component({
  selector: 'app-potreros-listado',
  standalone: true,
  imports: [ReactiveFormsModule, CardComponent, BadgeComponent, LucideMapPin, LucidePlus, LucideX],
  templateUrl: './listado.component.html',
})
export class ListadoComponent {
  private readonly potreroService = inject(PotreroService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly potreros = signal<PotreroSummaryModel[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly puedeEscribir = computed(() => {
    const rol = this.authService.usuario()?.rol;
    return rol === 'dueno_finca' || rol === 'administrador_finca';
  });

  readonly mostrarModal = signal(false);
  readonly editando = signal<PotreroSummaryModel | null>(null);
  readonly guardando = signal(false);
  readonly errorGuardar = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    hectareas: [null as number | null, Validators.min(0.01)],
    tipoPasto: [''],
    capacidadEstimada: [null as number | null, Validators.min(1)],
  });

  constructor() {
    this.cargar();
  }

  estadoVariant(estado: EstadoPotrero): BadgeVariant {
    return ESTADO_VARIANT[estado];
  }

  estadoLabel(estado: EstadoPotrero): string {
    return ESTADO_LABEL[estado];
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.potreroService.listar().subscribe({
      next: (potreros) => {
        this.potreros.set(potreros);
        this.cargando.set(false);
      },
      error: (err: { message?: string }) => {
        this.error.set(err?.message ?? 'No se pudo cargar la lista de potreros');
        this.cargando.set(false);
      },
    });
  }

  abrirModalCrear(): void {
    this.editando.set(null);
    this.form.reset({ nombre: '', hectareas: null, tipoPasto: '', capacidadEstimada: null });
    this.errorGuardar.set(null);
    this.mostrarModal.set(true);
  }

  abrirModalEditar(potrero: PotreroSummaryModel): void {
    this.editando.set(potrero);
    this.form.reset({
      nombre: potrero.nombre,
      hectareas: potrero.hectareas,
      tipoPasto: potrero.tipoPasto ?? '',
      capacidadEstimada: potrero.capacidadEstimada,
    });
    this.errorGuardar.set(null);
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.errorGuardar.set(null);
    const valores = this.form.getRawValue();
    const dto = {
      nombre: valores.nombre,
      hectareas: valores.hectareas ?? undefined,
      tipoPasto: valores.tipoPasto || undefined,
      capacidadEstimada: valores.capacidadEstimada ?? undefined,
    };
    const editando = this.editando();
    const request$ = editando
      ? this.potreroService.actualizar(editando.id, dto)
      : this.potreroService.crear(dto);

    request$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModal.set(false);
        this.cargar();
      },
      error: (err: { message?: string }) => {
        this.guardando.set(false);
        this.errorGuardar.set(err?.message ?? 'No se pudo guardar el potrero');
      },
    });
  }
}
