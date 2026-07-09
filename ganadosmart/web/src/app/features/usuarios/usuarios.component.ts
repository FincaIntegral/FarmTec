import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideEllipsisVertical, LucidePlus, LucideX } from '@lucide/angular';
import { RolUsuario } from '../../core/models/domain-types';
import { UsuarioDetailModel } from '../../core/models/usuario';
import { UsuarioService } from '../../core/services/usuario.service';
import { BadgeComponent, BadgeVariant } from '../../shared/components/badge/badge.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { calcularIniciales } from '../../shared/utils/iniciales.util';

const ROL_LABEL: Record<RolUsuario, string> = {
  dueno_finca: 'Dueño',
  administrador_finca: 'Administrador',
  veterinario: 'Veterinario',
  usuario_consulta: 'Consulta',
};

const ROL_VARIANT: Record<RolUsuario, BadgeVariant> = {
  dueno_finca: 'green',
  administrador_finca: 'blue',
  veterinario: 'purple',
  usuario_consulta: 'gray',
};

const ROLES: RolUsuario[] = ['dueno_finca', 'administrador_finca', 'veterinario', 'usuario_consulta'];

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    CardComponent,
    BadgeComponent,
    LucidePlus,
    LucideX,
    LucideEllipsisVertical,
  ],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent {
  private readonly usuarioService = inject(UsuarioService);
  private readonly fb = inject(FormBuilder);

  readonly usuarios = signal<UsuarioDetailModel[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly pagina = signal(1);
  readonly totalPaginas = signal(1);
  readonly totalRegistros = signal(0);

  readonly roles = ROLES;

  readonly mostrarModalInvitar = signal(false);
  readonly invitando = signal(false);
  readonly errorInvitar = signal<string | null>(null);

  readonly formInvitar = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(8)]],
    rol: ['veterinario' as RolUsuario, Validators.required],
  });

  constructor() {
    this.cargar();
  }

  iniciales(nombre: string): string {
    return calcularIniciales(nombre);
  }

  rolLabel(rol: RolUsuario): string {
    return ROL_LABEL[rol];
  }

  rolVariant(rol: RolUsuario): BadgeVariant {
    return ROL_VARIANT[rol];
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.usuarioService.listar({ pagina: this.pagina(), limite: 20 }).subscribe({
      next: (resp) => {
        this.usuarios.set(resp.datos);
        this.totalPaginas.set(resp.meta.totalPaginas);
        this.totalRegistros.set(resp.meta.totalRegistros);
        this.cargando.set(false);
      },
      error: (err: { message?: string }) => {
        this.error.set(err?.message ?? 'No se pudo cargar la lista de usuarios');
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

  abrirModalInvitar(): void {
    this.formInvitar.reset({ nombre: '', correo: '', contrasena: '', rol: 'veterinario' });
    this.errorInvitar.set(null);
    this.mostrarModalInvitar.set(true);
  }

  cerrarModalInvitar(): void {
    this.mostrarModalInvitar.set(false);
  }

  invitar(): void {
    if (this.formInvitar.invalid) {
      this.formInvitar.markAllAsTouched();
      return;
    }
    this.invitando.set(true);
    this.errorInvitar.set(null);
    this.usuarioService.crear(this.formInvitar.getRawValue()).subscribe({
      next: () => {
        this.invitando.set(false);
        this.mostrarModalInvitar.set(false);
        this.pagina.set(1);
        this.cargar();
      },
      error: (err: { message?: string }) => {
        this.invitando.set(false);
        this.errorInvitar.set(err?.message ?? 'No se pudo invitar al usuario');
      },
    });
  }
}
