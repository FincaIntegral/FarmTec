import type { LucideIconData } from '@lucide/angular';
import {
  LucideHeart,
  LucideHistory,
  LucideLayoutDashboard,
  LucideMapPin,
  LucideReceipt,
  LucideShoppingCart,
  LucideSkull,
  LucideTag,
  LucideUsers,
} from '@lucide/angular';
import { RolUsuario } from '../../../core/models/domain-types';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIconData;
  roles: RolUsuario[];
}

const TODOS_LOS_ROLES: RolUsuario[] = [
  'dueno_finca',
  'administrador_finca',
  'veterinario',
  'usuario_consulta',
];

// GET /reportes/dashboard, /ventas, /gastos y /usuarios (listado) están
// restringidos por contrato — el resto no tiene restricción de lectura.
export const NAV_ITEMS: readonly NavItem[] = [
  { path: 'dashboard', label: 'Dashboard', icon: LucideLayoutDashboard.icon, roles: ['dueno_finca', 'administrador_finca'] },
  { path: 'animales', label: 'Animales', icon: LucideTag.icon, roles: TODOS_LOS_ROLES },
  { path: 'reproduccion', label: 'Reproducción', icon: LucideHeart.icon, roles: TODOS_LOS_ROLES },
  { path: 'potreros', label: 'Potreros', icon: LucideMapPin.icon, roles: TODOS_LOS_ROLES },
  { path: 'ventas', label: 'Ventas', icon: LucideShoppingCart.icon, roles: ['dueno_finca', 'administrador_finca'] },
  { path: 'gastos', label: 'Gastos', icon: LucideReceipt.icon, roles: ['dueno_finca', 'administrador_finca'] },
  { path: 'mortalidad', label: 'Mortalidad', icon: LucideSkull.icon, roles: TODOS_LOS_ROLES },
  { path: 'historial', label: 'Historial', icon: LucideHistory.icon, roles: ['dueno_finca'] },
  { path: 'usuarios', label: 'Usuarios', icon: LucideUsers.icon, roles: ['dueno_finca'] },
] as const;

// Primera ruta accesible para cada rol — a dónde aterriza tras el login.
export function primeraRutaDisponible(rol: RolUsuario): string {
  const item = NAV_ITEMS.find((n) => n.roles.includes(rol));
  return item ? item.path : 'animales';
}
