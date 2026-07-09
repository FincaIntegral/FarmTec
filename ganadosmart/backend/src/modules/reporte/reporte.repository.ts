import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CategoriaGasto } from '../../shared/enums/categoria-gasto.enum';
import { TipoActividad } from './dto/actividad-query.dto';

export interface FilaActividad {
  tipo: TipoActividad;
  descripcion: string;
  entidad_id: string;
  entidad_codigo: string;
  usuario_id: string | null;
  usuario_nombre: string | null;
  usuario_rol: string | null;
  fecha: Date;
  total_count: string;
}

export interface FilaMortalidad {
  animal_id: string;
  codigo: string;
  categoria: string;
  fecha: string;
  causa: string;
}

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
              COUNT(*) FILTER (WHERE tipo = 'inseminacion'
                AND created_at > NOW() - INTERVAL '7 days')
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

  // Total histórico de animales muertos (no solo los últimos 12 meses).
  async totalMuertos(fincaId: string): Promise<number> {
    const fila = await this.uno<{ muertos: string }>(
      `SELECT COUNT(*) AS muertos
         FROM animal
        WHERE finca_id = $1 AND estado = 'muerto'`,
      [fincaId],
    );
    return parseInt(fila.muertos, 10);
  }

  // Solo pesajes de animales que siguen en el hato (activo/en_tratamiento) —
  // un pesaje de un animal ya muerto o vendido no refleja actividad vigente.
  async pesajes7Dias(fincaId: string): Promise<number> {
    const fila = await this.uno<{ pesajes: string }>(
      `SELECT COUNT(*) AS pesajes
         FROM historial_peso hp
         JOIN animal a ON a.id = hp.animal_id
        WHERE hp.finca_id = $1 AND hp.created_at > NOW() - INTERVAL '7 days'
          AND a.estado IN ('activo', 'en_tratamiento')`,
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

  // ── Historial de actividad (timeline de auditoría, solo dueño) ──
  //
  // UNION de las tablas que registran una acción de usuario. Cada rama emite
  // la misma forma: tipo, descripcion, entidad_id, entidad_codigo, usuario_id,
  // fecha. La atribución (usuario) sale de las columnas *_por existentes:
  //   registrado_por → peso, mortalidad, movimiento
  //   creado_por     → reproduccion (nueva), venta, gasto
  //   aprobado_por   → venta/gasto aprobada/rechazada (solo acción manual;
  //                    las auto-aprobadas tienen aprobado_por NULL y no cuentan)
  // animal y potrero NO tienen columna de usuario en el schema → usuario_id
  // queda NULL (evento sin atribución). parto_confirmado tampoco tiene
  // confirmado_por → NULL; se fecha por la creación del becerro (que ocurre al
  // confirmar) y muestra el código del becerro.
  //
  // ponytail: escaneo completo de 8 tablas por request — barato en el piloto.
  // Si el log crece, materializar en una tabla evento_actividad poblada por
  // triggers o por los services, con índice (finca_id, fecha DESC).
  actividad(
    fincaId: string,
    filtros: {
      usuarioId?: string;
      tipo?: TipoActividad;
      fechaInicio?: string;
      fechaFin?: string;
    },
    pagina: number,
    limite: number,
  ): Promise<FilaActividad[]> {
    return this.dataSource.query(
      `SELECT t.tipo, t.descripcion, t.entidad_id, t.entidad_codigo,
              t.usuario_id, u.nombre AS usuario_nombre, u.rol::text AS usuario_rol,
              t.fecha,
              COUNT(*) OVER() AS total_count
         FROM (
           SELECT 'animal_creado' AS tipo,
                  'Registró el animal ' || a.codigo AS descripcion,
                  a.id AS entidad_id, a.codigo AS entidad_codigo,
                  NULL::uuid AS usuario_id, a.created_at AS fecha
             FROM animal a WHERE a.finca_id = $1

           UNION ALL
           SELECT 'peso_registrado',
                  'Registró peso de ' || hp.peso_kg || ' kg para ' || a.codigo,
                  hp.id, a.codigo, hp.registrado_por, hp.created_at
             FROM historial_peso hp JOIN animal a ON a.id = hp.animal_id
            WHERE hp.finca_id = $1

           UNION ALL
           SELECT 'mortalidad_registrada',
                  'Registró la muerte de ' || a.codigo || ' (' || m.causa || ')',
                  m.id, a.codigo, m.registrado_por, m.created_at
             FROM mortalidad m JOIN animal a ON a.id = m.animal_id
            WHERE m.finca_id = $1

           UNION ALL
           SELECT 'reproduccion_registrada',
                  'Registró un evento de ' || r.tipo::text || ' para ' || vaca.codigo,
                  r.id, vaca.codigo, r.creado_por, r.created_at
             FROM reproduccion r JOIN animal vaca ON vaca.id = r.vaca_id
            WHERE r.finca_id = $1

           UNION ALL
           SELECT 'parto_confirmado',
                  'Confirmó el parto: nació ' || b.codigo,
                  r.id, b.codigo, NULL::uuid, b.created_at
             FROM reproduccion r JOIN animal b ON b.id = r.becerro_resultante_id
            WHERE r.finca_id = $1 AND r.estado = 'exitoso'

           UNION ALL
           SELECT 'potrero_creado',
                  'Creó el potrero ' || p.nombre,
                  p.id, p.nombre, NULL::uuid, p.created_at
             FROM potrero p WHERE p.finca_id = $1

           UNION ALL
           SELECT 'movimiento_registrado',
                  'Movió el animal ' || a.codigo || ' de potrero',
                  mv.id, a.codigo, mv.registrado_por, mv.created_at
             FROM movimiento_ganado mv JOIN animal a ON a.id = mv.animal_id
            WHERE mv.finca_id = $1

           UNION ALL
           SELECT 'venta_creada',
                  'Registró una venta a ' || v.comprador || ' por ' || v.monto,
                  v.id, v.comprador, v.creado_por, v.created_at
             FROM venta v WHERE v.finca_id = $1

           UNION ALL
           SELECT 'venta_aprobada',
                  'Aprobó la venta a ' || v.comprador || ' por ' || v.monto,
                  v.id, v.comprador, v.aprobado_por, v.created_at
             FROM venta v
            WHERE v.finca_id = $1 AND v.estado_aprobacion = 'aprobado'
              AND v.aprobado_por IS NOT NULL

           UNION ALL
           SELECT 'venta_rechazada',
                  'Rechazó la venta a ' || v.comprador,
                  v.id, v.comprador, v.aprobado_por, v.created_at
             FROM venta v
            WHERE v.finca_id = $1 AND v.estado_aprobacion = 'rechazado'

           UNION ALL
           SELECT 'gasto_creado',
                  'Registró un gasto de ' || g.categoria::text || ' por ' || g.monto,
                  g.id, g.categoria::text, g.creado_por, g.created_at
             FROM gasto g WHERE g.finca_id = $1

           UNION ALL
           SELECT 'gasto_aprobado',
                  'Aprobó un gasto de ' || g.categoria::text || ' por ' || g.monto,
                  g.id, g.categoria::text, g.aprobado_por, g.created_at
             FROM gasto g
            WHERE g.finca_id = $1 AND g.estado_aprobacion = 'aprobado'
              AND g.aprobado_por IS NOT NULL

           UNION ALL
           SELECT 'gasto_rechazado',
                  'Rechazó un gasto de ' || g.categoria::text,
                  g.id, g.categoria::text, g.aprobado_por, g.created_at
             FROM gasto g
            WHERE g.finca_id = $1 AND g.estado_aprobacion = 'rechazado'
         ) t
         LEFT JOIN usuario u ON u.id = t.usuario_id
        WHERE ($2::uuid IS NULL OR t.usuario_id = $2)
          AND ($3::text IS NULL OR t.tipo = $3)
          AND ($4::date IS NULL OR t.fecha >= $4)
          AND ($5::date IS NULL OR t.fecha < ($5::date + 1))
        ORDER BY t.fecha DESC
        LIMIT $6 OFFSET $7`,
      [
        fincaId,
        filtros.usuarioId ?? null,
        filtros.tipo ?? null,
        filtros.fechaInicio ?? null,
        filtros.fechaFin ?? null,
        limite,
        (pagina - 1) * limite,
      ],
    ) as Promise<FilaActividad[]>;
  }

  // ── Mortalidad (para la pantalla de Mortalidad) ──
  // Un registro por animal muerto con fecha y causa (viven en la tabla
  // mortalidad, no en animal) + categoría/código del animal para los gráficos.
  mortalidades(fincaId: string): Promise<FilaMortalidad[]> {
    return this.dataSource.query(
      `SELECT a.id AS animal_id, a.codigo, a.categoria::text AS categoria,
              m.fecha, m.causa
         FROM mortalidad m JOIN animal a ON a.id = m.animal_id
        WHERE m.finca_id = $1
        ORDER BY m.fecha DESC`,
      [fincaId],
    ) as Promise<FilaMortalidad[]>;
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
