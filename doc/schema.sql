-- ============================================================
-- GanadoSmart — Script de creación de base de datos
-- PostgreSQL 15+ (Railway / Supabase)
-- Versión: 1.1
-- Cambios v1.0 → v1.1:
--   - Reemplazado por gen_random_uuid() nativo de PG13+ (sin extensiones)
--   - FINCA: agregado campo codigo asignable por el usuario
--   - ANIMAL: agregado campo codigo asignable (caravana/arete/chip ICA)
--     El UUID interno sigue siendo la PK para no romper FK al corregir códigos
-- JZSolutions
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================

CREATE TYPE rol_usuario AS ENUM (
  'dueno_finca',
  'administrador_finca',
  'veterinario',
  'usuario_consulta'
);

CREATE TYPE categoria_animal AS ENUM (
  'toro',
  'vaca',
  'becerro'
);

CREATE TYPE sexo_animal AS ENUM (
  'macho',
  'hembra'
);

CREATE TYPE estado_animal AS ENUM (
  'activo',
  'en_tratamiento',
  'vendido',
  'muerto'
);

CREATE TYPE tipo_reproduccion AS ENUM (
  'monta_natural',
  'inseminacion'
);

CREATE TYPE estado_reproduccion AS ENUM (
  'en_curso',
  'exitoso',
  'fallido'
);

CREATE TYPE estado_potrero AS ENUM (
  'en_uso',
  'disponible',
  'descanso',
  'mantenimiento'
);

CREATE TYPE estado_aprobacion AS ENUM (
  'pendiente',
  'aprobado',
  'rechazado'
);

-- Reemplaza nivel_escalamiento del diseño anterior
-- directa    = el Dueño la aprobó manualmente
-- por_monto  = estaba bajo el umbral configurado → auto-aprobada
-- por_tiempo = venció el plazo de espera → auto-aprobada
-- pendiente  = aún sin resolver
CREATE TYPE tipo_aprobacion AS ENUM (
  'directa',
  'por_monto',
  'por_tiempo',
  'pendiente'
);

CREATE TYPE categoria_gasto AS ENUM (
  'insumos',
  'nomina',
  'veterinario',
  'otro'
);

CREATE TYPE tipo_origen_alerta AS ENUM (
  'animal',
  'venta',
  'gasto',
  'potrero'
);

CREATE TYPE severidad_alerta AS ENUM (
  'critica',
  'alta',
  'media',
  'info'
);

CREATE TYPE tipo_accion_sync AS ENUM (
  'registrar_peso',
  'registrar_mortalidad',
  'registrar_movimiento'
);

CREATE TYPE estado_sync AS ENUM (
  'pendiente',
  'aplicado',
  'conflicto',
  'error'
);

-- ============================================================
-- 2. FINCA
-- codigo: asignable por el usuario (ej. código ICA, "FINCA-001")
-- ============================================================
CREATE TABLE finca (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Código asignable por el usuario — puede ser el registro ICA
  -- de la finca, un código propio, lo que el Dueño prefiera.
  -- Se puede corregir sin afectar ninguna FK porque la PK es UUID.
  codigo        VARCHAR(100)  NOT NULL UNIQUE,

  nombre        VARCHAR(200)  NOT NULL,
  hectareas     NUMERIC(10,2),
  municipio     VARCHAR(100),
  departamento  VARCHAR(100),
  ubicacion     TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. USUARIO
-- ============================================================
CREATE TABLE usuario (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  finca_id        UUID          NOT NULL,
  nombre          VARCHAR(200)  NOT NULL,
  correo          VARCHAR(255)  NOT NULL,
  contrasena_hash TEXT          NOT NULL,
  rol             rol_usuario   NOT NULL,
  activo          BOOLEAN       NOT NULL DEFAULT TRUE,
  ultimo_acceso   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_usuario_finca
    FOREIGN KEY (finca_id) REFERENCES finca(id) ON DELETE RESTRICT,

  -- Un correo es único dentro de una finca
  CONSTRAINT uq_usuario_correo_finca
    UNIQUE (finca_id, correo)
);

-- ============================================================
-- 4. CONFIGURACION_APROBACION (1 a 1 con FINCA)
-- ============================================================
CREATE TABLE configuracion_aprobacion (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  finca_id                UUID        NOT NULL,

  -- NULL = nunca auto-aprobar por monto
  monto_umbral_auto       NUMERIC(15,2),

  -- NULL = esperar indefinidamente (sin auto-aprobación por tiempo)
  dias_espera_aprobacion  INTEGER     CHECK (dias_espera_aprobacion > 0),

  aplica_a_ventas         BOOLEAN     NOT NULL DEFAULT TRUE,
  aplica_a_gastos         BOOLEAN     NOT NULL DEFAULT TRUE,

  configurado_por         UUID,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_config_finca
    FOREIGN KEY (finca_id) REFERENCES finca(id) ON DELETE RESTRICT,

  CONSTRAINT fk_config_usuario
    FOREIGN KEY (configurado_por) REFERENCES usuario(id) ON DELETE SET NULL,

  CONSTRAINT uq_config_finca
    UNIQUE (finca_id)
);

-- ============================================================
-- 5. ANIMAL
-- codigo: asignable por el usuario (caravana, arete, chip ICA)
-- El UUID interno es la PK — así el código se puede corregir
-- sin romper ninguna FK (reproduccion, venta, historial_peso, etc.)
-- ============================================================
CREATE TABLE animal (
  id                          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  finca_id                    UUID              NOT NULL,

  -- Código asignable por el usuario: número de caravana/arete/chip
  -- tal como aparece en los documentos del ICA y guías de movilización.
  -- Único dentro de la finca (dos fincas pueden tener el mismo código).
  -- Se puede corregir con un simple UPDATE sin afectar la integridad.
  codigo                      VARCHAR(100)      NOT NULL,

  -- Auto-relación de genealogía (nullable)
  madre_id                    UUID,
  padre_id                    UUID,

  categoria                   categoria_animal  NOT NULL,
  sexo                        sexo_animal       NOT NULL,
  fecha_nacimiento            DATE,
  raza                        VARCHAR(100),
  valor_comercial_estimado    NUMERIC(15,2),

  -- Override manual del Administrador sobre el valor calculado
  valor_comercial_ajustado    NUMERIC(15,2),

  -- URL al bucket externo — PENDIENTE decidir proveedor (Supabase Storage / S3)
  foto_url                    TEXT,

  estado                      estado_animal     NOT NULL DEFAULT 'activo',
  created_at                  TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_animal_finca
    FOREIGN KEY (finca_id) REFERENCES finca(id) ON DELETE RESTRICT,

  -- Auto-relaciones nombradas explícitamente (TypeORM las necesita así)
  CONSTRAINT fk_animal_madre
    FOREIGN KEY (madre_id) REFERENCES animal(id) ON DELETE SET NULL,

  CONSTRAINT fk_animal_padre
    FOREIGN KEY (padre_id) REFERENCES animal(id) ON DELETE SET NULL,

  -- El código del animal es único dentro de cada finca
  CONSTRAINT uq_animal_codigo_finca
    UNIQUE (finca_id, codigo)
);

-- ============================================================
-- 6. HISTORIAL_PESO
-- ============================================================
CREATE TABLE historial_peso (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id       UUID          NOT NULL,
  finca_id        UUID          NOT NULL,
  peso_kg         NUMERIC(8,2)  NOT NULL CHECK (peso_kg > 0),
  fecha           DATE          NOT NULL,
  registrado_por  UUID,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_peso_animal
    FOREIGN KEY (animal_id) REFERENCES animal(id) ON DELETE CASCADE,

  CONSTRAINT fk_peso_finca
    FOREIGN KEY (finca_id) REFERENCES finca(id) ON DELETE RESTRICT,

  CONSTRAINT fk_peso_usuario
    FOREIGN KEY (registrado_por) REFERENCES usuario(id) ON DELETE SET NULL
);

-- ============================================================
-- 7. MORTALIDAD (1 a 1 con ANIMAL)
-- ============================================================
CREATE TABLE mortalidad (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id       UUID        NOT NULL,
  finca_id        UUID        NOT NULL,
  fecha           DATE        NOT NULL,
  causa           TEXT        NOT NULL,
  registrado_por  UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_mortalidad_animal
    FOREIGN KEY (animal_id) REFERENCES animal(id) ON DELETE CASCADE,

  CONSTRAINT fk_mortalidad_finca
    FOREIGN KEY (finca_id) REFERENCES finca(id) ON DELETE RESTRICT,

  CONSTRAINT fk_mortalidad_usuario
    FOREIGN KEY (registrado_por) REFERENCES usuario(id) ON DELETE SET NULL,

  -- Un animal solo puede morir una vez
  CONSTRAINT uq_mortalidad_animal
    UNIQUE (animal_id)
);

-- ============================================================
-- 8. REPRODUCCION
-- ============================================================
CREATE TABLE reproduccion (
  id                    UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  finca_id              UUID                NOT NULL,
  -- NULL cuando la inseminación fue con pajilla externa (sin toro propio)
  toro_id               UUID,
  vaca_id               UUID                NOT NULL,
  tipo                  tipo_reproduccion   NOT NULL,
  fecha                 DATE                NOT NULL,
  fecha_probable_parto  DATE,
  estado                estado_reproduccion NOT NULL DEFAULT 'en_curso',

  -- Pajilla externa (inseminación artificial sin toro propio) — ambos se
  -- llenan juntos o ninguno, ver chk_repro_origen_semen
  pajilla_proveedor     VARCHAR(200),
  pajilla_raza          VARCHAR(150),

  -- Se llena al confirmar parto exitoso
  -- El becerro se crea con madre_id y padre_id heredados automáticamente
  becerro_resultante_id UUID,

  created_at            TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_repro_finca
    FOREIGN KEY (finca_id) REFERENCES finca(id) ON DELETE RESTRICT,

  CONSTRAINT fk_repro_toro
    FOREIGN KEY (toro_id) REFERENCES animal(id) ON DELETE RESTRICT,

  CONSTRAINT fk_repro_vaca
    FOREIGN KEY (vaca_id) REFERENCES animal(id) ON DELETE RESTRICT,

  CONSTRAINT fk_repro_becerro
    FOREIGN KEY (becerro_resultante_id) REFERENCES animal(id) ON DELETE SET NULL,

  -- Una vaca no puede tener dos eventos reproductivos activos al mismo tiempo
  CONSTRAINT uq_repro_vaca_en_curso
    EXCLUDE USING btree (vaca_id WITH =)
    WHERE (estado = 'en_curso'),

  -- monta_natural siempre requiere un toro propio (monta física) y nunca
  -- pajilla; inseminacion admite EXACTAMENTE una de las dos opciones:
  -- toro propio (semen propio) O pajilla externa (proveedor + raza juntos).
  CONSTRAINT chk_repro_origen_semen CHECK (
    (tipo = 'monta_natural' AND toro_id IS NOT NULL
      AND pajilla_proveedor IS NULL AND pajilla_raza IS NULL)
    OR
    (tipo = 'inseminacion' AND (
      (toro_id IS NOT NULL AND pajilla_proveedor IS NULL AND pajilla_raza IS NULL)
      OR
      (toro_id IS NULL AND pajilla_proveedor IS NOT NULL AND pajilla_raza IS NOT NULL)
    ))
  )
);

-- ============================================================
-- 9. POTRERO
-- nombre es string libre: "Potrero Occidental", "Potrero 1", "La Laguna"
-- ============================================================
CREATE TABLE potrero (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  finca_id            UUID          NOT NULL,

  -- Nombre libre asignado por el Dueño
  nombre              VARCHAR(150)  NOT NULL,

  hectareas           NUMERIC(10,2),
  tipo_pasto          VARCHAR(150),

  -- Informativo: el sistema avisa si se supera, no bloquea
  capacidad_estimada  INTEGER       CHECK (capacidad_estimada > 0),

  estado              estado_potrero NOT NULL DEFAULT 'disponible',
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_potrero_finca
    FOREIGN KEY (finca_id) REFERENCES finca(id) ON DELETE RESTRICT,

  -- Nombre único dentro de la finca
  CONSTRAINT uq_potrero_nombre_finca
    UNIQUE (finca_id, nombre)
);

-- ============================================================
-- 10. MOVIMIENTO_GANADO
-- ============================================================
CREATE TABLE movimiento_ganado (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  finca_id            UUID        NOT NULL,
  animal_id           UUID        NOT NULL,
  potrero_origen_id   UUID        NOT NULL,
  potrero_destino_id  UUID        NOT NULL,
  fecha               DATE        NOT NULL,
  observacion         TEXT,
  registrado_por      UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_mov_finca
    FOREIGN KEY (finca_id) REFERENCES finca(id) ON DELETE RESTRICT,

  CONSTRAINT fk_mov_animal
    FOREIGN KEY (animal_id) REFERENCES animal(id) ON DELETE RESTRICT,

  CONSTRAINT fk_mov_origen
    FOREIGN KEY (potrero_origen_id) REFERENCES potrero(id) ON DELETE RESTRICT,

  CONSTRAINT fk_mov_destino
    FOREIGN KEY (potrero_destino_id) REFERENCES potrero(id) ON DELETE RESTRICT,

  CONSTRAINT fk_mov_usuario
    FOREIGN KEY (registrado_por) REFERENCES usuario(id) ON DELETE SET NULL,

  -- No tiene sentido moverse al mismo potrero
  CONSTRAINT chk_mov_potreros_distintos
    CHECK (potrero_origen_id <> potrero_destino_id)
);

-- ============================================================
-- 11. VENTA
-- ============================================================
CREATE TABLE venta (
  id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  finca_id          UUID              NOT NULL,
  animal_id         UUID,
  comprador         VARCHAR(300)      NOT NULL,
  monto             NUMERIC(15,2)     NOT NULL CHECK (monto > 0),
  fecha             DATE              NOT NULL,
  estado_aprobacion estado_aprobacion NOT NULL DEFAULT 'pendiente',
  tipo_aprobacion   tipo_aprobacion   NOT NULL DEFAULT 'pendiente',

  -- Marca permanente: TRUE si se aprobó sin acción del Dueño
  auto_aprobado     BOOLEAN           NOT NULL DEFAULT FALSE,

  creado_por        UUID              NOT NULL,
  aprobado_por      UUID,
  motivo_rechazo    TEXT,
  created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_venta_finca
    FOREIGN KEY (finca_id) REFERENCES finca(id) ON DELETE RESTRICT,

  CONSTRAINT fk_venta_animal
    FOREIGN KEY (animal_id) REFERENCES animal(id) ON DELETE RESTRICT,

  CONSTRAINT fk_venta_creado
    FOREIGN KEY (creado_por) REFERENCES usuario(id) ON DELETE RESTRICT,

  CONSTRAINT fk_venta_aprobado
    FOREIGN KEY (aprobado_por) REFERENCES usuario(id) ON DELETE SET NULL,

  -- auto_aprobado solo puede ser TRUE si el tipo lo justifica
  CONSTRAINT chk_venta_auto_aprobado
    CHECK (
      auto_aprobado = FALSE
      OR tipo_aprobacion IN ('por_monto', 'por_tiempo')
    )
);

-- ============================================================
-- 12. GASTO (mismo esquema de aprobación que VENTA)
-- ============================================================
CREATE TABLE gasto (
  id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  finca_id          UUID              NOT NULL,
  categoria         categoria_gasto   NOT NULL,
  monto             NUMERIC(15,2)     NOT NULL CHECK (monto > 0),
  descripcion       TEXT,
  fecha             DATE              NOT NULL,
  estado_aprobacion estado_aprobacion NOT NULL DEFAULT 'pendiente',
  tipo_aprobacion   tipo_aprobacion   NOT NULL DEFAULT 'pendiente',
  auto_aprobado     BOOLEAN           NOT NULL DEFAULT FALSE,
  creado_por        UUID              NOT NULL,
  aprobado_por      UUID,
  motivo_rechazo    TEXT,
  created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_gasto_finca
    FOREIGN KEY (finca_id) REFERENCES finca(id) ON DELETE RESTRICT,

  CONSTRAINT fk_gasto_creado
    FOREIGN KEY (creado_por) REFERENCES usuario(id) ON DELETE RESTRICT,

  CONSTRAINT fk_gasto_aprobado
    FOREIGN KEY (aprobado_por) REFERENCES usuario(id) ON DELETE SET NULL,

  CONSTRAINT chk_gasto_auto_aprobado
    CHECK (
      auto_aprobado = FALSE
      OR tipo_aprobacion IN ('por_monto', 'por_tiempo')
    )
);

-- ============================================================
-- 13. ALERTA
-- referencia_id es polimórfico — sin FK formal (integridad en servicio)
-- ============================================================
CREATE TABLE alerta (
  id             UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  finca_id       UUID                NOT NULL,
  referencia_id  UUID                NOT NULL,
  tipo_origen    tipo_origen_alerta  NOT NULL,
  mensaje        TEXT                NOT NULL,
  severidad      severidad_alerta    NOT NULL DEFAULT 'info',
  leida          BOOLEAN             NOT NULL DEFAULT FALSE,
  fecha          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_alerta_finca
    FOREIGN KEY (finca_id) REFERENCES finca(id) ON DELETE RESTRICT
);

-- ============================================================
-- 14. ACCION_SYNC (exclusiva del cliente móvil)
-- ============================================================
CREATE TABLE accion_sync (
  id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  finca_id          UUID              NOT NULL,
  usuario_id        UUID              NOT NULL,
  tipo_accion       tipo_accion_sync  NOT NULL,
  timestamp_local   TIMESTAMPTZ       NOT NULL,
  version_base      TEXT,

  -- Payload varía según tipo_accion:
  -- registrar_peso       → { animal_id, peso_kg, fecha }
  -- registrar_mortalidad → { animal_id, fecha, causa }
  -- registrar_movimiento → { animal_id, potrero_origen_id, potrero_destino_id, fecha }
  datos             JSONB             NOT NULL,

  estado_sync       estado_sync       NOT NULL DEFAULT 'pendiente',
  detalle_conflicto JSONB,
  procesado_en      TIMESTAMPTZ,

  CONSTRAINT fk_sync_finca
    FOREIGN KEY (finca_id) REFERENCES finca(id) ON DELETE RESTRICT,

  CONSTRAINT fk_sync_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE RESTRICT
);

-- ============================================================
-- 15. ÍNDICES
-- ============================================================

-- FINCA — búsqueda por código asignado
CREATE INDEX idx_finca_codigo        ON finca(codigo);

-- USUARIO
CREATE INDEX idx_usuario_finca       ON usuario(finca_id);
CREATE INDEX idx_usuario_correo      ON usuario(correo);

-- ANIMAL — el campo codigo es el que el usuario busca en pantalla
CREATE INDEX idx_animal_finca        ON animal(finca_id);
CREATE INDEX idx_animal_codigo       ON animal(finca_id, codigo);
CREATE INDEX idx_animal_estado       ON animal(finca_id, estado);
CREATE INDEX idx_animal_sexo         ON animal(finca_id, sexo);
CREATE INDEX idx_animal_madre        ON animal(madre_id) WHERE madre_id IS NOT NULL;
CREATE INDEX idx_animal_padre        ON animal(padre_id) WHERE padre_id IS NOT NULL;

-- HISTORIAL_PESO — gráfico de peso en orden cronológico
CREATE INDEX idx_peso_animal_fecha   ON historial_peso(animal_id, fecha DESC);

-- REPRODUCCION — conteo de inseminaciones (vaca) y servicios (toro)
CREATE INDEX idx_repro_vaca          ON reproduccion(finca_id, vaca_id);
CREATE INDEX idx_repro_toro          ON reproduccion(finca_id, toro_id);
CREATE INDEX idx_repro_estado        ON reproduccion(finca_id, estado);

-- POTRERO
CREATE INDEX idx_potrero_finca       ON potrero(finca_id);

-- MOVIMIENTO_GANADO
CREATE INDEX idx_mov_animal          ON movimiento_ganado(animal_id, fecha DESC);
CREATE INDEX idx_mov_finca           ON movimiento_ganado(finca_id);

-- VENTA
CREATE INDEX idx_venta_finca         ON venta(finca_id);
CREATE INDEX idx_venta_estado        ON venta(finca_id, estado_aprobacion);
CREATE INDEX idx_venta_fecha         ON venta(finca_id, fecha DESC);
CREATE INDEX idx_venta_creado_por    ON venta(creado_por);

-- Índice parcial: solo ventas pendientes (cron job + Dueño)
CREATE INDEX idx_venta_pendientes
  ON venta(finca_id, created_at)
  WHERE estado_aprobacion = 'pendiente';

-- GASTO
CREATE INDEX idx_gasto_finca         ON gasto(finca_id);
CREATE INDEX idx_gasto_estado        ON gasto(finca_id, estado_aprobacion);
CREATE INDEX idx_gasto_categoria     ON gasto(finca_id, categoria);
CREATE INDEX idx_gasto_fecha         ON gasto(finca_id, fecha DESC);

CREATE INDEX idx_gasto_pendientes
  ON gasto(finca_id, created_at)
  WHERE estado_aprobacion = 'pendiente';

-- ALERTA — no leídas por finca (campanita y widget del Dashboard)
CREATE INDEX idx_alerta_no_leida
  ON alerta(finca_id, fecha DESC)
  WHERE leida = FALSE;

-- ACCION_SYNC — acciones pendientes de procesar
CREATE INDEX idx_sync_pendientes
  ON accion_sync(finca_id, timestamp_local)
  WHERE estado_sync = 'pendiente';

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
-- Para correr en Railway:
--   psql $DATABASE_URL -f schema.sql
--
-- Para correr en Supabase:
--   SQL Editor → pegar y ejecutar
--
-- Para TypeORM (NestJS): este script es la referencia exacta
-- para escribir las entidades y migraciones — TypeORM gestiona
-- el esquema a través de sus migraciones, no con SQL crudo.
-- ============================================================
