import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideHeart, LucidePlus, LucideSearch, LucideX } from '@lucide/angular';
import { AuthService } from '../../../core/auth/auth.service';
import { AnimalSummaryModel } from '../../../core/models/animal';
import { CategoriaAnimal, SexoAnimal } from '../../../core/models/domain-types';
import { AnimalService } from '../../../core/services/animal.service';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { CardComponent } from '../../../shared/components/card/card.component';

type FiltroSexo = 'Todos' | 'Hembras' | 'Machos';

const ESTADO_VARIANT: Record<string, BadgeVariant> = {
  activo: 'green',
  en_tratamiento: 'yellow',
  vendido: 'blue',
  muerto: 'gray',
};

@Component({
  selector: 'app-animales-listado',
  standalone: true,
  imports: [ReactiveFormsModule, CardComponent, BadgeComponent, LucideSearch, LucidePlus, LucideHeart, LucideX],
  templateUrl: './listado.component.html',
})
export class ListadoComponent {
  private readonly animalService = inject(AnimalService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly animales = signal<AnimalSummaryModel[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly busqueda = signal('');
  readonly filtroSexo = signal<FiltroSexo>('Todos');
  readonly pagina = signal(1);
  readonly totalPaginas = signal(1);
  readonly totalRegistros = signal(0);

  readonly filtrosSexo: FiltroSexo[] = ['Todos', 'Hembras', 'Machos'];

  readonly puedeCrear = computed(() => {
    const rol = this.authService.usuario()?.rol;
    return rol === 'dueno_finca' || rol === 'administrador_finca';
  });

  readonly mostrarModalCrear = signal(false);
  readonly creando = signal(false);
  readonly errorCrear = signal<string | null>(null);

  readonly formCrear = this.fb.nonNullable.group({
    codigo: ['', Validators.required],
    categoria: ['vaca' as CategoriaAnimal, Validators.required],
    sexo: ['hembra' as SexoAnimal, Validators.required],
    raza: [''],
    fechaNacimiento: [''],
  });

  constructor() {
    this.cargar();
  }

  estadoVariant(estado: string): BadgeVariant {
    return ESTADO_VARIANT[estado] ?? 'gray';
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    const sexo: SexoAnimal | undefined =
      this.filtroSexo() === 'Hembras' ? 'hembra' : this.filtroSexo() === 'Machos' ? 'macho' : undefined;

    this.animalService
      .listar({ buscar: this.busqueda() || undefined, sexo, pagina: this.pagina(), limite: 20 })
      .subscribe({
        next: (resp) => {
          this.animales.set(resp.datos);
          this.totalPaginas.set(resp.meta.totalPaginas);
          this.totalRegistros.set(resp.meta.totalRegistros);
          this.cargando.set(false);
        },
        error: (err: { message?: string }) => {
          this.error.set(err?.message ?? 'No se pudo cargar la lista de animales');
          this.cargando.set(false);
        },
      });
  }

  onBuscar(valor: string): void {
    this.busqueda.set(valor);
    this.pagina.set(1);
    this.cargar();
  }

  onFiltroSexo(filtro: FiltroSexo): void {
    this.filtroSexo.set(filtro);
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

  verDetalle(id: string): void {
    void this.router.navigate(['/animales', id]);
  }

  abrirModalCrear(): void {
    this.formCrear.reset({ codigo: '', categoria: 'vaca', sexo: 'hembra', raza: '', fechaNacimiento: '' });
    this.errorCrear.set(null);
    this.mostrarModalCrear.set(true);
  }

  cerrarModalCrear(): void {
    this.mostrarModalCrear.set(false);
  }

  crearAnimal(): void {
    if (this.formCrear.invalid) {
      this.formCrear.markAllAsTouched();
      return;
    }
    this.creando.set(true);
    this.errorCrear.set(null);
    const valores = this.formCrear.getRawValue();
    this.animalService
      .crear({
        codigo: valores.codigo,
        categoria: valores.categoria,
        sexo: valores.sexo,
        raza: valores.raza || undefined,
        fechaNacimiento: valores.fechaNacimiento || undefined,
      })
      .subscribe({
        next: () => {
          this.creando.set(false);
          this.mostrarModalCrear.set(false);
          this.cargar();
        },
        error: (err: { message?: string }) => {
          this.creando.set(false);
          this.errorCrear.set(err?.message ?? 'No se pudo crear el animal');
        },
      });
  }
}
