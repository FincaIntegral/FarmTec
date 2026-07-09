export const apiEndpoints = {
  AUTH: {
    LOGIN: '/auth/login',
  },
  USUARIOS: {
    LIST: '/usuarios',
    CREATE: '/usuarios',
    DESACTIVAR: (id: string): string => `/usuarios/${id}/desactivar`,
    REACTIVAR: (id: string): string => `/usuarios/${id}/reactivar`,
    CAMBIAR_PASSWORD: (id: string): string => `/usuarios/${id}/password`,
  },
  CONFIGURACION: {
    APROBACION: '/configuracion/aprobacion',
  },
  ANIMALES: {
    LIST: '/animales',
    CREATE: '/animales',
    DETAIL: (id: string): string => `/animales/${id}`,
    REGISTER_WEIGHT: (id: string): string => `/animales/${id}/peso`,
    REGISTER_MORTALIDAD: (id: string): string => `/animales/${id}/mortalidad`,
    REACTIVAR: (id: string): string => `/animales/${id}/reactivar`,
    SOLICITAR_REACTIVACION: (id: string): string => `/animales/${id}/solicitar-reactivacion`,
    UPDATE_PHOTO: (id: string): string => `/animales/${id}/foto`,
    UPLOAD_PHOTO: (id: string): string => `/animales/${id}/foto/upload`,
  },
  REPRODUCCION: {
    LIST: '/reproducciones',
    CREATE: '/reproducciones',
    CONFIRM_PARTO: (id: string): string => `/reproducciones/${id}/confirmar-parto`,
  },
  POTREROS: {
    LIST: '/potreros',
    CREATE: '/potreros',
    DETAIL: (id: string): string => `/potreros/${id}`,
    MOVIMIENTOS: '/potreros/movimientos',
  },
  VENTAS: {
    LIST: '/ventas',
    CREATE: '/ventas',
    APPROVE: (id: string): string => `/ventas/${id}/aprobar`,
    REJECT: (id: string): string => `/ventas/${id}/rechazar`,
  },
  GASTOS: {
    LIST: '/gastos',
    CREATE: '/gastos',
    APPROVE: (id: string): string => `/gastos/${id}/aprobar`,
    REJECT: (id: string): string => `/gastos/${id}/rechazar`,
  },
  REPORTES: {
    DASHBOARD: '/reportes/dashboard',
    INGRESOS_VS_GASTOS: '/reportes/ingresos-vs-gastos',
    MORTALIDAD: '/reportes/mortalidad',
    ACTIVIDAD: '/reportes/actividad',
  },
  ALERTAS: {
    LIST: '/alertas',
    MARK_AS_READ: (id: string): string => `/alertas/${id}/marcar-leida`,
  },
  SINCRONIZACION: {
    LOTE: '/sincronizacion/lote',
    RESOLVER_CONFLICTO: '/sincronizacion/resolver-conflicto',
  },
} as const;
