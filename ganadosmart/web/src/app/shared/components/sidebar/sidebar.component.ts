import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideBeef, LucideChevronLeft, LucideChevronRight, LucideDynamicIcon, LucideLock, LucideLogOut } from '@lucide/angular';
import { AuthService } from '../../../core/auth/auth.service';
import { calcularIniciales } from '../../utils/iniciales.util';
import { NAV_ITEMS } from './nav-items';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideDynamicIcon,
    LucideBeef,
    LucideLock,
    LucideLogOut,
    LucideChevronLeft,
    LucideChevronRight,
  ],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);

  readonly collapsed = input(false);
  readonly toggle = output<void>();

  private readonly usuario = this.authService.usuario;

  readonly navItems = computed(() => {
    const rol = this.usuario()?.rol;
    return rol ? NAV_ITEMS.filter((item) => item.roles.includes(rol)) : [];
  });

  readonly nombre = computed(() => this.usuario()?.nombre ?? '');

  readonly rolLegible = computed(() => {
    const rol = this.usuario()?.rol;
    const etiquetas: Record<string, string> = {
      dueno_finca: 'Dueño de finca',
      administrador_finca: 'Administrador de finca',
      veterinario: 'Veterinario',
      usuario_consulta: 'Usuario de consulta',
    };
    return rol ? (etiquetas[rol] ?? rol) : '';
  });

  readonly iniciales = computed(() => calcularIniciales(this.nombre()));

  logout(): void {
    this.authService.logout();
  }
}
