import { Routes } from '@angular/router';
import { authGuard, guestGuard, landingRedirectGuard, roleGuard } from './core/guards/role.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { DetalleComponent } from './features/animales/detalle/detalle.component';
import { ListadoComponent } from './features/animales/listado/listado.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PotrerosComponent } from './features/potreros/potreros.component';
import { ReproduccionComponent } from './features/reproduccion/reproduccion.component';
import { RegistroComponent as VentasRegistroComponent } from './features/ventas/registro/registro.component';
import { AppShellComponent } from './layout/app-shell.component';
import { TempPlaceholderComponent } from './temp-placeholder.component';

const SOLO_DUENO_ADMIN = roleGuard('dueno_finca', 'administrador_finca');

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', canActivate: [landingRedirectGuard], children: [] },
      { path: 'dashboard', component: DashboardComponent, canActivate: [SOLO_DUENO_ADMIN], data: { title: 'Dashboard' } },
      { path: 'animales', component: ListadoComponent, data: { title: 'Animales' } },
      { path: 'animales/:id', component: DetalleComponent, data: { title: 'Ficha Animal' } },
      { path: 'reproduccion', component: ReproduccionComponent, data: { title: 'Reproducción' } },
      { path: 'potreros', component: PotrerosComponent, data: { title: 'Potreros' } },
      { path: 'ventas', component: VentasRegistroComponent, canActivate: [SOLO_DUENO_ADMIN], data: { title: 'Ventas' } },
      { path: 'gastos', component: TempPlaceholderComponent, canActivate: [SOLO_DUENO_ADMIN], data: { title: 'Gastos' } },
      { path: 'mortalidad', component: TempPlaceholderComponent, data: { title: 'Mortalidad' } },
      { path: 'usuarios', component: TempPlaceholderComponent, canActivate: [roleGuard('dueno_finca')], data: { title: 'Usuarios' } },
    ],
  },
  { path: '**', redirectTo: '' },
];
