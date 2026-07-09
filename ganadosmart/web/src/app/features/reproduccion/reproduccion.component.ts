import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideHeart, LucidePlus, LucideX } from '@lucide/angular';
import { AuthService } from '../../core/auth/auth.service';
import { AnimalSummaryModel } from '../../core/models/animal';
import { EstadoReproduccion, SexoAnimal, TipoReproduccion } from '../../core/models/domain-types';
import { ReproduccionDetailModel } from '../../core/models/reproduccion';
import { AnimalService } from '../../core/services/animal.service';
import { ReproduccionService } from '../../core/services/reproduccion.service';
import { BadgeComponent, BadgeVariant } from '../../shared/components/badge/badge.component';
import { CardComponent } from '../../shared/components/card/card.component';

type FiltroEstado = 'Todos' | EstadoReproduccion;

const ESTADO_VARIANT: Record<EstadoReproduccion, BadgeVariant> = {
  en_curso: 'yellow',
  exitoso: 'green',
  fallido: 'red',
};

const ESTADO_LABEL: Record<EstadoReproduccion, string> = {
  en_curso: 'En curso',
  exitoso: 'Exitoso',
  fallido: 'Fallido',
};

@Component({
  selector: 'app-reproduccion',
  standalone: true,
  imports: [ReactiveFormsModule, CardComponent, BadgeComponent, LucideHeart, LucidePlus, LucideX],
  templateUrl: './reproduccion.component.html',
})
export class ReproduccionComponent {
  private readonly reproduccionService = inject(ReproduccionService);
  private readonly animalService = inject(AnimalService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly registros = signal<ReproduccionDetailModel[]>([]);
  readonly animales = signal<AnimalSummaryModel[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly filtroEstado = signal<FiltroEstado>('Todos');
  readonly pagina = signal(1);
  readonly totalPaginas = signal(1);
  readonly totalRegistros = signal(0);

  readonly filtrosEstado: FiltroEstado[] = ['Todos', 'en_curso', 'exitoso', 'fallido'];

  // Un becerro todavía no está en edad reproductiva, y un animal muerto o
  // vendido no puede iniciar un evento reproductivo — se excluyen de ambos selects.
  // El lookup de código (codigoAnimal) sí necesita TODOS los animales,
  // incluyendo los ya muertos/vendidos, para no mostrar el UUID crudo en filas históricas.
  readonly toros = computed(() =>
    this.animales().filter(
      (a) => a.categoria === 'toro' && a.estado === 'activo',
    ),
  );
  readonly vacas = computed(() =>
    this.animales().filter(
      (a) => a.categoria === 'vaca' && a.estado === 'activo',
    ),
  );

  readonly puedeRegistrar = computed(() => {
    const rol = this.authService.usuario()?.rol;
    return rol === 'dueno_finca' || rol === 'administrador_finca' || rol === 'veterinario';
  });

  readonly mostrarModalCrear = signal(false);
  readonly creando = signal(false);
  readonly errorCrear = signal<string | null>(null);

  readonly formCrear = this.fb.nonNullable.group({
    tipo: ['monta_natural' as TipoReproduccion, Validators.required],
    // Solo aplica cuando tipo=inseminacion: elegir entre toro propio o pajilla externa.
    origenSemen: ['toro' as 'toro' | 'pajilla'],
    toroId: [''],
    pajillaProveedor: [''],
    pajillaRaza: [''],
    vacaId: ['', Validators.required],
    fecha: [this.hoy(), Validators.required],
  });

  readonly mostrarModalParto = signal(false);
  readonly registroParto = signal<ReproduccionDetailModel | null>(null);
  readonly confirmando = signal(false);
  readonly errorParto = signal<string | null>(null);

  readonly formParto = this.fb.nonNullable.group({
    resultado: ['exitoso' as 'exitoso' | 'fallido', Validators.required],
    becerroSexo: ['hembra' as SexoAnimal],
    becerroCodigo: [''],
    becerroPeso: [null as number | null],
    becerroFecha: [''],
  });

  constructor() {
    this.cargar();
    this.animalService.listar({ limite: 100 }).subscribe((resp) => this.animales.set(resp.datos));
  }

  codigoAnimal(id: string): string {
    return this.animales().find((a) => a.id === id)?.codigo ?? id;
  }

  origenSemenTexto(r: ReproduccionDetailModel): string {
    if (r.toroId) {
      return this.codigoAnimal(r.toroId);
    }
    if (r.pajillaProveedor || r.pajillaRaza) {
      return `Pajilla — ${r.pajillaProveedor ?? '—'} (${r.pajillaRaza ?? '—'})`;
    }
    return '—';
  }

  estadoVariant(estado: EstadoReproduccion): BadgeVariant {
    return ESTADO_VARIANT[estado];
  }

  estadoLabel(estado: EstadoReproduccion): string {
    return ESTADO_LABEL[estado];
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    const filtro = this.filtroEstado();
    const estado: EstadoReproduccion | undefined = filtro === 'Todos' ? undefined : filtro;

    this.reproduccionService.listar({ estado, pagina: this.pagina(), limite: 20 }).subscribe({
      next: (resp) => {
        this.registros.set(resp.datos);
        this.totalPaginas.set(resp.meta.totalPaginas);
        this.totalRegistros.set(resp.meta.totalRegistros);
        this.cargando.set(false);
      },
      error: (err: { message?: string }) => {
        this.error.set(err?.message ?? 'No se pudo cargar el historial reproductivo');
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
    this.formCrear.reset({
      tipo: 'monta_natural',
      origenSemen: 'toro',
      toroId: '',
      pajillaProveedor: '',
      pajillaRaza: '',
      vacaId: '',
      fecha: this.hoy(),
    });
    this.errorCrear.set(null);
    this.mostrarModalCrear.set(true);
  }

  cerrarModalCrear(): void {
    this.mostrarModalCrear.set(false);
  }

  crear(): void {
    if (this.formCrear.controls.vacaId.invalid || this.formCrear.controls.fecha.invalid) {
      this.formCrear.markAllAsTouched();
      return;
    }
    const valores = this.formCrear.getRawValue();
    const usaPajilla = valores.tipo === 'inseminacion' && valores.origenSemen === 'pajilla';

    if (!usaPajilla && !valores.toroId) {
      this.errorCrear.set('Selecciona un toro de la finca');
      return;
    }
    if (usaPajilla && (!valores.pajillaProveedor || !valores.pajillaRaza)) {
      this.errorCrear.set('Completa el proveedor y la raza de la pajilla');
      return;
    }

    this.creando.set(true);
    this.errorCrear.set(null);
    this.reproduccionService
      .crear({
        tipo: valores.tipo,
        vacaId: valores.vacaId,
        fecha: valores.fecha,
        toroId: usaPajilla ? undefined : valores.toroId,
        pajillaProveedor: usaPajilla ? valores.pajillaProveedor : undefined,
        pajillaRaza: usaPajilla ? valores.pajillaRaza : undefined,
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
          this.errorCrear.set(err?.message ?? 'No se pudo registrar el evento reproductivo');
        },
      });
  }

  abrirModalParto(registro: ReproduccionDetailModel): void {
    this.registroParto.set(registro);
    this.formParto.reset({
      resultado: 'exitoso',
      becerroSexo: 'hembra',
      becerroCodigo: '',
      becerroPeso: null,
      becerroFecha: this.hoy(),
    });
    this.errorParto.set(null);
    this.mostrarModalParto.set(true);
  }

  cerrarModalParto(): void {
    this.mostrarModalParto.set(false);
  }

  confirmarParto(): void {
    const registro = this.registroParto();
    if (!registro) {
      return;
    }
    const valores = this.formParto.getRawValue();
    if (valores.resultado === 'exitoso' && !valores.becerroCodigo) {
      this.errorParto.set('El código del becerro es obligatorio cuando el parto fue exitoso');
      return;
    }
    this.confirmando.set(true);
    this.errorParto.set(null);
    this.reproduccionService
      .confirmarParto(registro.id, {
        resultado: valores.resultado,
        becerro:
          valores.resultado === 'exitoso'
            ? {
                sexo: valores.becerroSexo,
                codigo: valores.becerroCodigo,
                pesoNacimiento: valores.becerroPeso ?? undefined,
                fechaNacimiento: valores.becerroFecha || undefined,
              }
            : undefined,
      })
      .subscribe({
        next: () => {
          this.confirmando.set(false);
          this.mostrarModalParto.set(false);
          this.cargar();
        },
        error: (err: { message?: string }) => {
          this.confirmando.set(false);
          this.errorParto.set(err?.message ?? 'No se pudo confirmar el parto');
        },
      });
  }

  protected hoy(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
