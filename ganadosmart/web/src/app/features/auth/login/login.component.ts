import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideBeef, LucideChevronRight, LucideEye, LucideEyeOff, LucideRefreshCw, LucideMoon, LucideSun } from '@lucide/angular';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, LucideBeef, LucideChevronRight, LucideEye, LucideEyeOff, LucideRefreshCw, LucideMoon, LucideSun],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mostrarContrasena = signal(false);

  readonly form = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', Validators.required],
    recordar: [true],
  });

  alternarVisibilidadContrasena(): void {
    this.mostrarContrasena.update((valor) => !valor);
  }

  onSubmit(): void {
    if (this.form.invalid || this.cargando()) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    const { correo, contrasena } = this.form.getRawValue();

    this.authService.login({ correo, contrasena }).subscribe({
      next: () => {
        this.cargando.set(false);
        void this.router.navigateByUrl('/');
      },
      error: (err: { message?: string }) => {
        this.cargando.set(false);
        this.error.set(err?.message ?? 'No se pudo iniciar sesión');
      },
    });
  }
}
