export const apiEndpoints = {
  AUTH: {
    LOGIN: '/auth/login',
  },
  USUARIOS: {
    LIST: '/usuarios',
    CREATE: '/usuarios',
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
    UPDATE_PHOTO: (id: string): string => `/animales/${id}/foto`,
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
