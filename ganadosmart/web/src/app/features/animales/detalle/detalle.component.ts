import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideArrowLeft,
  LucideBeef,
  LucideHeart,
  LucidePlus,
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
    LucidePlus,
    LucideSkull,
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
