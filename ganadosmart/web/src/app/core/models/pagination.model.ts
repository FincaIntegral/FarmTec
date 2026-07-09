export interface PaginacionMetaModel {
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  limite: number;
}

export interface PaginatedResponseModel<T> {
  datos: T[];
  meta: PaginacionMetaModel;
}
