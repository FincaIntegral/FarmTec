export interface DashboardModel {
  totalAnimales: number;
  animalesMuertos: number;
  vacas: number;
  toros: number;
  becerros: number;
  pesoPromedio: number | null;
  tasaNatalidad: number;
  tasaMortalidad: number;
  ingresosMes: number;
  gastosMes: number;
  balanceMes: number;
  valorEstimadoHato: number;
  pendientesAprobacion: number;
  porcentajeAutoAprobado: number;
  actividadReciente: {
    pesosUltimos7Dias: number;
    cambiosEstadoSalud: number;
    inseminacionesRegistradas: number;
    proximosAParto: number;
  };
  distribucionPorSexo: {
    machos: number;
    hembras: number;
  };
}
