import { Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { LucideMenu, LucideMoon, LucideSun } from '@lucide/angular';
import { filter, map } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { calcularIniciales } from '../../utils/iniciales.util';
import { DotComponent } from '../dot/dot.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [LucideMenu, LucideSun, LucideMoon, DotComponent],
  templateUrl: './topbar.component.html',
})
export class TopbarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isDark = input(true);
  readonly sidebarToggle = output<void>();
  readonly themeToggle = output<void>();

  readonly iniciales = computed(() => calcularIniciales(this.authService.usuario()?.nombre ?? ''));

  readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.tituloActual())
    ),
    { initialValue: this.tituloActual() }
  );

  // routerState.snapshot es un árbol ya resuelto — a diferencia de recorrer
  // ActivatedRoute.root vivo, no puede toparse con un nodo a mitad de
  // actualización (que causaba "Cannot read properties of undefined" en la
  // cadena de redirects login → landingRedirectGuard → ruta final).
  private tituloActual(): string {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return (route.data['title'] as string | undefined) ?? 'Dashboard';
  }
}
