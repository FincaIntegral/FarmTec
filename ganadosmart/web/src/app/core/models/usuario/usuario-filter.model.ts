// GET /usuarios solo acepta paginación (PaginacionQueryDto).
export interface UsuarioFilterModel {
  pagina?: number;
  limite?: number;
}
