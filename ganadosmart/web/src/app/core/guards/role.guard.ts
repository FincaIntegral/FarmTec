import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { primeraRutaDisponible } from '../../shared/components/sidebar/nav-items';
import { AuthService } from '../auth/auth.service';
import { RolUsuario } from '../models/domain-types';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estaAutenticado()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.estaAutenticado()) {
    return true;
  }
  return router.createUrlTree(['/']);
};

export function roleGuard(...rolesPermitidos: RolUsuario[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const rol = authService.usuario()?.rol;
    if (rol && rolesPermitidos.includes(rol)) {
      return true;
    }
    return router.createUrlTree(['/']);
  };
}

// Ruta '' (aterrizaje post-login): redirige a la primera vista que el rol
// del usuario sí puede ver. No todos los roles pueden ver /dashboard
// (GET /reportes/dashboard es solo dueno_finca/administrador_finca), así
// que un redirectTo:'dashboard' estático causaría un loop con roleGuard
// para veterinario/usuario_consulta.
export const landingRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const rol = authService.usuario()?.rol;
  const ruta = rol ? primeraRutaDisponible(rol) : 'animales';
  return router.createUrlTree(['/', ruta]);
};
