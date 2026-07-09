import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideEllipsisVertical, LucidePlus, LucideX, LucideAlertCircle } from '@lucide/angular';
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
    LucideAlertCircle,
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
  readonly usuarioMenuAbierto = signal<string | null>(null);

  readonly mostrarModalInvitar = signal(false);
  readonly invitando = signal(false);
  readonly errorInvitar = signal<string | null>(null);

  readonly mostrarModalCambiarPassword = signal(false);
  readonly usuarioSeleccionado = signal<UsuarioDetailModel | null>(null);
  readonly cambiandoPassword = signal(false);
  readonly errorPassword = signal<string | null>(null);

  readonly mostrarModalAccion = signal(false);
  readonly accion = signal<'desactivar' | 'reactivar' | null>(null);
  readonly procesandoAccion = signal(false);
  readonly errorAccion = signal<string | null>(null);

  readonly formInvitar = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(8)]],
    rol: ['veterinario' as RolUsuario, Validators.required],
  });

  readonly formPassword = this.fb.nonNullable.group({
    nuevaContrasena: ['', [Validators.required, Validators.minLength(8)]],
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

  abrirMenuOpciones(usuario: UsuarioDetailModel, event: Event): void {
    event.stopPropagation();
    this.usuarioMenuAbierto.set(this.usuarioMenuAbierto() === usuario.id ? null : usuario.id);
  }

  cerrarMenu(): void {
    this.usuarioMenuAbierto.set(null);
  }

  abrirModalCambiarPassword(usuario: UsuarioDetailModel): void {
    this.usuarioSeleccionado.set(usuario);
    this.formPassword.reset({ nuevaContrasena: '' });
    this.errorPassword.set(null);
    this.mostrarModalCambiarPassword.set(true);
  }

  cerrarModalCambiarPassword(): void {
    this.mostrarModalCambiarPassword.set(false);
    this.usuarioSeleccionado.set(null);
  }

  cambiarPassword(): void {
    if (this.formPassword.invalid || !this.usuarioSeleccionado()) {
      this.formPassword.markAllAsTouched();
      return;
    }
    this.cambiandoPassword.set(true);
    this.errorPassword.set(null);
    this.usuarioService.cambiarContrasena(
      this.usuarioSeleccionado()!.id,
      this.formPassword.getRawValue(),
    ).subscribe({
      next: () => {
        this.cambiandoPassword.set(false);
        this.mostrarModalCambiarPassword.set(false);
        this.cargar();
      },
      error: (err: { message?: string }) => {
        this.cambiandoPassword.set(false);
        this.errorPassword.set(err?.message ?? 'No se pudo cambiar la contraseña');
      },
    });
  }

  abrirModalDesactivar(usuario: UsuarioDetailModel): void {
    this.usuarioSeleccionado.set(usuario);
    this.accion.set('desactivar');
    this.errorAccion.set(null);
    this.mostrarModalAccion.set(true);
  }

  abrirModalReactivar(usuario: UsuarioDetailModel): void {
    this.usuarioSeleccionado.set(usuario);
    this.accion.set('reactivar');
    this.errorAccion.set(null);
    this.mostrarModalAccion.set(true);
  }

  cerrarModalAccion(): void {
    this.mostrarModalAccion.set(false);
    this.usuarioSeleccionado.set(null);
    this.accion.set(null);
  }

  ejecutarAccion(): void {
    if (!this.usuarioSeleccionado() || !this.accion()) {
      return;
    }

    this.procesandoAccion.set(true);
    this.errorAccion.set(null);

    const usuarioId = this.usuarioSeleccionado()!.id;
    const acc = this.accion()!;

    const request = acc === 'desactivar'
      ? this.usuarioService.desactivar(usuarioId)
      : this.usuarioService.reactivar(usuarioId);

    request.subscribe({
      next: () => {
        this.procesandoAccion.set(false);
        this.mostrarModalAccion.set(false);
        this.cargar();
      },
      error: (err: { message?: string }) => {
        this.procesandoAccion.set(false);
        this.errorAccion.set(err?.message ?? `No se pudo ${acc} el usuario`);
      },
    });
  }
}
