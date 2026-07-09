import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucidePlus, LucideX } from '@lucide/angular';
import { AuthService } from '../../../core/auth/auth.service';
import { AnimalSummaryModel } from '../../../core/models/animal';
import { MovimientoGanadoDetailModel } from '../../../core/models/movimiento-ganado';
import { PotreroSummaryModel } from '../../../core/models/potrero';
import { AnimalService } from '../../../core/services/animal.service';
import { PotreroService } from '../../../core/services/potrero.service';
import { CardComponent } from '../../../shared/components/card/card.component';

@Component({
  selector: 'app-potreros-movimiento',
  standalone: true,
  imports: [ReactiveFormsModule, CardComponent, LucidePlus, LucideX],
  templateUrl: './movimiento.component.html',
})
export class MovimientoComponent {
  private readonly potreroService = inject(PotreroService);
  private readonly animalService = inject(AnimalService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly movimientos = signal<MovimientoGanadoDetailModel[]>([]);
  readonly potreros = signal<PotreroSummaryModel[]>([]);
  readonly animales = signal<AnimalSummaryModel[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly pagina = signal(1);
  readonly totalPaginas = signal(1);
  readonly totalRegistros = signal(0);

  readonly puedeRegistrar = computed(() => {
    const rol = this.authService.usuario()?.rol;
    return rol === 'dueno_finca' || rol === 'administrador_finca' || rol === 'veterinario';
  });

  readonly mostrarModal = signal(false);
  readonly registrando = signal(false);
  readonly errorRegistrar = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    animalId: ['', Validators.required],
    potreroOrigenId: ['', Validators.required],
    potreroDestinoId: ['', Validators.required],
    fecha: [this.hoy(), Validators.required],
    observacion: [''],
  });

  constructor() {
    this.cargar();
    this.potreroService.listar().subscribe((potreros) => this.potreros.set(potreros));
    this.animalService.listar({ estado: 'activo', limite: 100 }).subscribe((resp) => this.animales.set(resp.datos));
  }

  nombrePotrero(id: string): string {
    return this.potreros().find((p) => p.id === id)?.nombre ?? id;
  }

  codigoAnimal(id: string): string {
    return this.animales().find((a) => a.id === id)?.codigo ?? id;
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.potreroService.listarMovimientos({ pagina: this.pagina(), limite: 20 }).subscribe({
      next: (resp) => {
        this.movimientos.set(resp.datos);
        this.totalPaginas.set(resp.meta.totalPaginas);
        this.totalRegistros.set(resp.meta.totalRegistros);
        this.cargando.set(false);
      },
      error: (err: { message?: string }) => {
        this.error.set(err?.message ?? 'No se pudo cargar el historial de movimientos');
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

  abrirModal(): void {
    this.form.reset({ animalId: '', potreroOrigenId: '', potreroDestinoId: '', fecha: this.hoy(), observacion: '' });
    this.errorRegistrar.set(null);
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  registrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    if (valores.potreroOrigenId === valores.potreroDestinoId) {
      this.errorRegistrar.set('El potrero de origen y destino no pueden ser el mismo');
      return;
    }
    this.registrando.set(true);
    this.errorRegistrar.set(null);
    this.potreroService
      .registrarMovimiento({
        animalId: valores.animalId,
        potreroOrigenId: valores.potreroOrigenId,
        potreroDestinoId: valores.potreroDestinoId,
        fecha: valores.fecha,
        observacion: valores.observacion || undefined,
      })
      .subscribe({
        next: () => {
          this.registrando.set(false);
          this.mostrarModal.set(false);
          this.pagina.set(1);
          this.cargar();
        },
        error: (err: { message?: string }) => {
          this.registrando.set(false);
          this.errorRegistrar.set(err?.message ?? 'No se pudo registrar el movimiento');
        },
      });
  }

  private hoy(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
