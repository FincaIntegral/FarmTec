import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CategoriaGasto } from '../../shared/enums/categoria-gasto.enum';

// Reportes es solo lectura: agregaciones SQL directas sobre las tablas de
// los otros módulos. Cada query lleva finca_id = $1 (aislamiento multi-tenant).
@Injectable()
export class ReporteRepository {
  constructor(private readonly dataSource: DataSource) {}

  private async uno<T>(sql: string, params: unknown[]): Promise<T> {
    const filas = (await this.dataSource.query(sql, params)) as T[];
    return filas[0];
  }

  // ── Conteos e inventario (hato = activos + en_tratamiento) ──

  conteosHato(fincaId: string) {
    return this.uno<{
      total: string;
      vacas: string;
      toros: string;
      becerros: string;
      machos: string;
      hembras: string;
      en_tratamiento: string;
      valor_hato: string | null;
    }>(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE categoria = 'vaca')    AS vacas,
              COUNT(*) FILTER (WHERE categoria = 'toro')    AS toros,
              COUNT(*) FILTER (WHERE categoria = 'becerro') AS becerros,
              COUNT(*) FILTER (WHERE sexo = 'macho')  AS machos,
              COUNT(*) FILTER (WHERE sexo = 'hembra') AS hembras,
              COUNT(*) FILTER (WHERE estado = 'en_tratamiento') AS en_tratamiento,
              SUM(COALESCE(valor_comercial_ajustado, valor_comercial_estimado)) AS valor_hato
         FROM animal
        WHERE finca_id = $1 AND estado IN ('activo', 'en_tratamiento')`,
      [fincaId],
    );
  }

  async pesoPromedio(fincaId: string): Promise<number | null> {
    const fila = await this.uno<{ promedio: string | null }>(
      `SELECT AVG(ultimo.peso_kg) AS promedio
         FROM (SELECT DISTINCT ON (hp.animal_id) hp.peso_kg
                 FROM historial_peso hp
                 JOIN animal a ON a.id = hp.animal_id
                WHERE a.finca_id = $1 AND a.estado IN ('activo', 'en_tratamiento')
                ORDER BY hp.animal_id, hp.fecha DESC) ultimo`,
      [fincaId],
    );
    return fila.promedio === null ? null : parseFloat(fila.promedio);
  }

  // ── Reproducción y mortalidad (ventana móvil de 12 meses) ──

  conteosReproduccion(fincaId: string) {
    return this.uno<{
      partos_exitosos_12m: string;
      inseminaciones_7d: string;
      proximos_a_parto: string;
    }>(
      `SELECT COUNT(*) FILTER (WHERE estado = 'exitoso'
                AND created_at > NOW() - INTERVAL '12 months') AS partos_exitosos_12m,
              COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')
                AS inseminaciones_7d,
              COUNT(*) FILTER (WHERE estado = 'en_curso'
                AND fecha_probable_parto <= CURRENT_DATE + 30) AS proximos_a_parto
         FROM reproduccion
        WHERE finca_id = $1`,
      [fincaId],
    );
  }

  async muertes12Meses(fincaId: string): Promise<number> {
    const fila = await this.uno<{ muertes: string }>(
      `SELECT COUNT(*) AS muertes
         FROM mortalidad
        WHERE finca_id = $1 AND created_at > NOW() - INTERVAL '12 months'`,
      [fincaId],
    );
    return parseInt(fila.muertes, 10);
  }

  async pesajes7Dias(fincaId: string): Promise<number> {
    const fila = await this.uno<{ pesajes: string }>(
      `SELECT COUNT(*) AS pesajes
         FROM historial_peso
        WHERE finca_id = $1 AND created_at > NOW() - INTERVAL '7 days'`,
      [fincaId],
    );
    return parseInt(fila.pesajes, 10);
  }

  // ── Finanzas (solo transacciones aprobadas suman) ──

  finanzasMesActual(fincaId: string) {
    return this.uno<{
      ingresos_mes: string;
      gastos_mes: string;
      pendientes: string;
      auto_aprobadas: string;
      total_transacciones: string;
    }>(
      `SELECT COALESCE(SUM(monto) FILTER (WHERE tipo = 'venta'
                AND estado_aprobacion = 'aprobado'
                AND date_trunc('month', fecha) = date_trunc('month', CURRENT_DATE)), 0)
                AS ingresos_mes,
              COALESCE(SUM(monto) FILTER (WHERE tipo = 'gasto'
                AND estado_aprobacion = 'aprobado'
                AND date_trunc('month', fecha) = date_trunc('month', CURRENT_DATE)), 0)
                AS gastos_mes,
              COUNT(*) FILTER (WHERE estado_aprobacion = 'pendiente') AS pendientes,
              COUNT(*) FILTER (WHERE auto_aprobado) AS auto_aprobadas,
              COUNT(*) AS total_transacciones
         FROM (SELECT 'venta' AS tipo, monto, fecha, estado_aprobacion, auto_aprobado
                 FROM venta WHERE finca_id = $1
               UNION ALL
               SELECT 'gasto', monto, fecha, estado_aprobacion, auto_aprobado
                 FROM gasto WHERE finca_id = $1) t`,
      [fincaId],
    );
  }

  // ── Reporte ingresos vs gastos ──

  transacciones(
    fincaId: string,
    fechaInicio?: string,
    fechaFin?: string,
    categoria?: CategoriaGasto,
  ) {
    // La categoría solo restringe gastos — los ingresos siempre se listan
    // completos para que el balance del rango sea real.
    return this.dataSource.query(
      `SELECT tipo, fecha, monto, estado_aprobacion, tipo_aprobacion, categoria
         FROM (SELECT 'venta' AS tipo, fecha, monto, estado_aprobacion,
                      tipo_aprobacion, NULL AS categoria
                 FROM venta WHERE finca_id = $1
               UNION ALL
               SELECT 'gasto', fecha, monto, estado_aprobacion,
                      tipo_aprobacion, categoria::text
                 FROM gasto WHERE finca_id = $1) t
        WHERE ($2::date IS NULL OR fecha >= $2)
          AND ($3::date IS NULL OR fecha <= $3)
          AND ($4::text IS NULL OR tipo = 'venta' OR categoria = $4)
        ORDER BY fecha DESC`,
      [fincaId, fechaInicio ?? null, fechaFin ?? null, categoria ?? null],
    ) as Promise<
      {
        tipo: 'venta' | 'gasto';
        fecha: string;
        monto: string;
        estado_aprobacion: string;
        tipo_aprobacion: string;
        categoria: string | null;
      }[]
    >;
  }
}
