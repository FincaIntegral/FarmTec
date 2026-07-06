import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideArrowLeft,
  LucideBeef,
  LucideCamera,
  LucideHeart,
  LucidePlus,
  LucideRotateCcw,
  LucideScale,
  LucideSkull,
  LucideTrendingUp,
  LucideX,
} from '@lucide/angular';
import { AuthService } from '../../../core/auth/auth.service';
import { AnimalDetailModel } from '../../../core/models/animal';
import { AnimalService } from '../../../core/services/animal.service';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header.component';
import { GenealogiaCardComponent } from './widgets/genealogia-card/genealogia-card.component';
import { PesoHistoryChartComponent } from './widgets/peso-history-chart/peso-history-chart.component';
import { TimelineHistorialComponent } from './widgets/timeline-historial/timeline-historial.component';

const ESTADO_VARIANT: Record<string, BadgeVariant> = {
  activo: 'green',
  en_tratamiento: 'yellow',
  vendido: 'blue',
  muerto: 'gray',
};

@Component({
  selector: 'app-animales-detalle',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardComponent,
    BadgeComponent,
    SectionHeaderComponent,
    KpiCardComponent,
    GenealogiaCardComponent,
    PesoHistoryChartComponent,
    TimelineHistorialComponent,
    LucideArrowLeft,
    LucideBeef,
    LucideCamera,
    LucidePlus,
    LucideSkull,
    LucideRotateCcw,
    LucideX,
  ],
  templateUrl: './detalle.component.html',
})
export class DetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly animalService = inject(AnimalService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly iconPeso = LucideScale.icon;
  protected readonly iconGdp = LucideTrendingUp.icon;
  protected readonly iconServicios = LucideHeart.icon;

  readonly animal = signal<AnimalDetailModel | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly puedeRegistrarCampo = computed(() => {
    const rol = this.authService.usuario()?.rol;
    return rol === 'dueno_finca' || rol === 'administrador_finca' || rol === 'veterinario';
  });

  readonly esDueno = computed(() => this.authService.usuario()?.rol === 'dueno_finca');
  readonly esAdmin = computed(() => this.authService.usuario()?.rol === 'administrador_finca');

  readonly edad = computed(() => {
    const fecha = this.animal()?.fechaNacimiento;
    return fecha ? this.calcularEdad(fecha) : null;
  });

  readonly gdp = computed(() => {
    const historial = this.animal()?.historialPeso ?? [];
    if (historial.length < 2) {
      return null;
    }
    const ordenado = [...historial].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const primero = ordenado[0];
    const ultimo = ordenado[ordenado.length - 1];
    const dias = (new Date(ultimo.fecha).getTime() - new Date(primero.fecha).getTime()) / 86_400_000;
    return dias > 0 ? (ultimo.pesoKg - primero.pesoKg) / dias : null;
  });

  estadoVariant(estado: string): BadgeVariant {
    return ESTADO_VARIANT[estado] ?? 'gray';
  }

  // ── Modal: registrar peso ──
  readonly mostrarModalPeso = signal(false);
  readonly registrandoPeso = signal(false);
  readonly errorPeso = signal<string | null>(null);
  readonly formPeso = this.fb.nonNullable.group({
    pesoKg: [0, [Validators.required, Validators.min(0.1)]],
    fecha: [this.hoy(), Validators.required],
  });

  // ── Modal: registrar mortalidad ──
  readonly mostrarModalMortalidad = signal(false);
  readonly registrandoMortalidad = signal(false);
  readonly errorMortalidad = signal<string | null>(null);
  readonly formMortalidad = this.fb.nonNullable.group({
    fecha: [this.hoy(), Validators.required],
    causa: ['', Validators.required],
  });

  // ── Modal: reactivar (mortalidad registrada por error) ──
  readonly mostrarModalReactivar = signal(false);
  readonly reactivando = signal(false);
  readonly errorReactivar = signal<string | null>(null);
  readonly formReactivar = this.fb.nonNullable.group({
    motivo: ['', Validators.required],
  });

  // ── Modal: solicitar reactivación (administrador → notifica al dueño) ──
  readonly mostrarModalSolicitar = signal(false);
  readonly solicitando = signal(false);
  readonly errorSolicitar = signal<string | null>(null);
  readonly solicitudEnviada = signal(false);
  readonly formSolicitar = this.fb.nonNullable.group({
    motivo: ['', Validators.required],
  });

  // ── Modal: foto — por URL o subiendo un archivo ──
  readonly mostrarModalFoto = signal(false);
  readonly guardandoFoto = signal(false);
  readonly errorFoto = signal<string | null>(null);
  readonly modoFoto = signal<'url' | 'archivo'>('url');
  readonly archivoFoto = signal<File | null>(null);
  readonly formFoto = this.fb.nonNullable.group({
    fotoUrl: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargar(id);
    }
  }

  cargar(id: string): void {
    this.cargando.set(true);
    this.error.set(null);
    this.animalService.obtener(id).subscribe({
      next: (a) => {
        this.animal.set(a);
        this.cargando.set(false);
      },
      error: (err: { message?: string }) => {
        this.error.set(err?.message ?? 'No se pudo cargar el animal');
        this.cargando.set(false);
      },
    });
  }

  volver(): void {
    void this.router.navigate(['/animales']);
  }

  abrirModalPeso(): void {
    this.formPeso.reset({ pesoKg: 0, fecha: this.hoy() });
    this.errorPeso.set(null);
    this.mostrarModalPeso.set(true);
  }

  cerrarModalPeso(): void {
    this.mostrarModalPeso.set(false);
  }

  registrarPeso(): void {
    const animal = this.animal();
    if (!animal || this.formPeso.invalid) {
      this.formPeso.markAllAsTouched();
      return;
    }
    this.registrandoPeso.set(true);
    this.errorPeso.set(null);
    this.animalService.registrarPeso(animal.id, this.formPeso.getRawValue()).subscribe({
      next: () => {
        this.registrandoPeso.set(false);
        this.mostrarModalPeso.set(false);
        this.cargar(animal.id);
      },
      error: (err: { message?: string }) => {
        this.registrandoPeso.set(false);
        this.errorPeso.set(err?.message ?? 'No se pudo registrar el peso');
      },
    });
  }

  abrirModalMortalidad(): void {
    this.formMortalidad.reset({ fecha: this.hoy(), causa: '' });
    this.errorMortalidad.set(null);
    this.mostrarModalMortalidad.set(true);
  }

  cerrarModalMortalidad(): void {
    this.mostrarModalMortalidad.set(false);
  }

  registrarMortalidad(): void {
    const animal = this.animal();
    if (!animal || this.formMortalidad.invalid) {
      this.formMortalidad.markAllAsTouched();
      return;
    }
    this.registrandoMortalidad.set(true);
    this.errorMortalidad.set(null);
    this.animalService.registrarMortalidad(animal.id, this.formMortalidad.getRawValue()).subscribe({
      next: () => {
        this.registrandoMortalidad.set(false);
        this.mostrarModalMortalidad.set(false);
        this.cargar(animal.id);
      },
      error: (err: { message?: string }) => {
        this.registrandoMortalidad.set(false);
        this.errorMortalidad.set(err?.message ?? 'No se pudo registrar la mortalidad');
      },
    });
  }

  abrirModalReactivar(): void {
    this.formReactivar.reset({ motivo: '' });
    this.errorReactivar.set(null);
    this.mostrarModalReactivar.set(true);
  }

  cerrarModalReactivar(): void {
    this.mostrarModalReactivar.set(false);
  }

  reactivar(): void {
    const animal = this.animal();
    if (!animal || this.formReactivar.invalid) {
      this.formReactivar.markAllAsTouched();
      return;
    }
    this.reactivando.set(true);
    this.errorReactivar.set(null);
    this.animalService.reactivar(animal.id, this.formReactivar.getRawValue()).subscribe({
      next: (actualizado) => {
        this.reactivando.set(false);
        this.mostrarModalReactivar.set(false);
        this.animal.set(actualizado);
      },
      error: (err: { message?: string }) => {
        this.reactivando.set(false);
        this.errorReactivar.set(err?.message ?? 'No se pudo reactivar el animal');
      },
    });
  }

  abrirModalSolicitar(): void {
    this.formSolicitar.reset({ motivo: '' });
    this.errorSolicitar.set(null);
    this.solicitudEnviada.set(false);
    this.mostrarModalSolicitar.set(true);
  }

  cerrarModalSolicitar(): void {
    this.mostrarModalSolicitar.set(false);
  }

  solicitarReactivacion(): void {
    const animal = this.animal();
    if (!animal || this.formSolicitar.invalid) {
      this.formSolicitar.markAllAsTouched();
      return;
    }
    this.solicitando.set(true);
    this.errorSolicitar.set(null);
    this.animalService.solicitarReactivacion(animal.id, this.formSolicitar.getRawValue()).subscribe({
      next: () => {
        this.solicitando.set(false);
        this.solicitudEnviada.set(true);
      },
      error: (err: { message?: string }) => {
        this.solicitando.set(false);
        this.errorSolicitar.set(err?.message ?? 'No se pudo enviar la solicitud');
      },
    });
  }

  abrirModalFoto(): void {
    this.formFoto.reset({ fotoUrl: this.animal()?.fotoUrl ?? '' });
    this.archivoFoto.set(null);
    this.modoFoto.set('url');
    this.errorFoto.set(null);
    this.mostrarModalFoto.set(true);
  }

  cerrarModalFoto(): void {
    this.mostrarModalFoto.set(false);
  }

  seleccionarModoFoto(modo: 'url' | 'archivo'): void {
    this.modoFoto.set(modo);
    this.errorFoto.set(null);
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoFoto.set(input.files?.[0] ?? null);
  }

  guardarFoto(): void {
    const animal = this.animal();
    if (!animal) {
      return;
    }

    if (this.modoFoto() === 'archivo') {
      const archivo = this.archivoFoto();
      if (!archivo) {
        this.errorFoto.set('Selecciona un archivo de imagen');
        return;
      }
      this.guardandoFoto.set(true);
      this.errorFoto.set(null);
      this.animalService.subirFoto(animal.id, archivo).subscribe({
        next: () => {
          this.guardandoFoto.set(false);
          this.mostrarModalFoto.set(false);
          this.cargar(animal.id);
        },
        error: (err: { message?: string }) => {
          this.guardandoFoto.set(false);
          this.errorFoto.set(err?.message ?? 'No se pudo subir la foto');
        },
      });
      return;
    }

    if (this.formFoto.invalid || !this.formFoto.value.fotoUrl) {
      this.errorFoto.set('Ingresa una URL de foto');
      return;
    }
    this.guardandoFoto.set(true);
    this.errorFoto.set(null);
    this.animalService.actualizarFoto(animal.id, this.formFoto.getRawValue()).subscribe({
      next: () => {
        this.guardandoFoto.set(false);
        this.mostrarModalFoto.set(false);
        this.cargar(animal.id);
      },
      error: (err: { message?: string }) => {
        this.guardandoFoto.set(false);
        this.errorFoto.set(err?.message ?? 'No se pudo actualizar la foto');
      },
    });
  }

  private calcularEdad(fechaNacimiento: string): string {
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let anios = hoy.getFullYear() - nacimiento.getFullYear();
    let meses = hoy.getMonth() - nacimiento.getMonth();
    if (meses < 0) {
      anios--;
      meses += 12;
    }
    if (anios > 0) {
      return `${anios} año${anios !== 1 ? 's' : ''} ${meses} mes${meses !== 1 ? 'es' : ''}`;
    }
    return `${meses} mes${meses !== 1 ? 'es' : ''}`;
  }

  private hoy(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
