export class PaginacionMeta {
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  limite: number;

  static build(
    totalRegistros: number,
    pagina: number,
    limite: number,
  ): PaginacionMeta {
    const meta = new PaginacionMeta();
    meta.paginaActual = pagina;
    meta.totalPaginas = Math.max(1, Math.ceil(totalRegistros / limite));
    meta.totalRegistros = totalRegistros;
    meta.limite = limite;
    return meta;
  }
}

export class PaginatedResponse<T> {
  datos: T[];
  meta: PaginacionMeta;
}
