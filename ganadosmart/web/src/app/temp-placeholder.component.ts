import { Component, inject } from '@angular/core';
import { AuthService } from './core/auth/auth.service';

// TEMPORAL: placeholder de aterrizaje post-login mientras se construye
// el Dashboard real (features/dashboard). Borrar este archivo y la ruta
// que lo usa en app.routes.ts cuando el Dashboard esté listo.
@Component({
  selector: 'app-temp-placeholder',
  standalone: true,
  template: `
    <div class="flex h-screen w-screen items-center justify-center bg-background text-foreground">
      <div class="text-center space-y-2">
        <p class="text-lg font-black">Sesión iniciada como {{ authService.usuario()?.nombre }}</p>
        <p class="text-sm text-muted-foreground">({{ authService.usuario()?.rol }}) — Dashboard real pendiente de construir.</p>
        <button
          type="button"
          (click)="authService.logout()"
          class="mt-4 text-xs font-bold text-amber-600 hover:text-amber-500"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  `,
})
export class TempPlaceholderComponent {
  readonly authService = inject(AuthService);
}
