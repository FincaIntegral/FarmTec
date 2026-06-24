# TRD — Sistema Inteligente de Gestión Ganadera
### Technical Requirements Document

**Versión:** 1.0
**Depende de:** 01_PRD.md, 02_UIUX.md, 03_FLUJO.md

---

## 1. Stack tecnológico

### 1.1 Web
- **Frontend:** Angular + TypeScript (stack ya usado en otros proyectos del autor).
- **Backend:** NestJS + TypeScript, **monolito modular** (ver justificación 1.3).
- **Base de datos:** PostgreSQL.

Esto coincide con la arquitectura de 3 capas ya diagramada en Visual Paradigm
(`Arquitectura_General`), que se valida y mantiene como base.

### 1.2 Móvil: Flutter vs. React Native (análisis abierto, decisión recomendada)

| Criterio | Flutter | React Native |
|---|---|---|
| Lenguaje | Dart (nuevo para el equipo) | JavaScript/TypeScript (ya dominado) |
| Rendimiento UI | Compila a nativo, muy consistente | Depende de puente JS-nativo, generalmente suficiente para este caso de uso |
| Reutilización con frontend web (Angular) | Ninguna (Dart ≠ TypeScript) | Parcial — mismo lenguaje, pero **no** mismos componentes (Angular ≠ React) |
| Soporte offline-first (clave para US del PRD) | Bueno, librerías maduras (`sqflite`, `drift`) | Bueno, librerías maduras (`WatermelonDB`, `redux-persist`) |
| Curva de aprendizaje para el equipo actual | Alta (lenguaje nuevo) | Baja-media (ya se domina TS) |

**Recomendación:** dado que el frontend web ya es Angular (no React), ninguna
opción da reutilización de código completa con la web — la decisión se reduce a
curva de aprendizaje. Se recomienda **React Native**, aprovechando el dominio
existente de TypeScript, salvo que el equipo prefiera invertir tiempo en Dart a
cambio de mayor consistencia visual nativa. **Esta decisión debe confirmarse
antes de iniciar desarrollo móvil**, no es definitiva en este documento.

### 1.3 Arquitectura: monolito modular vs. microservicios

**Decisión: monolito modular**, no microservicios, para el MVP y el piloto.

Justificación:
- El diagrama de arquitectura ya existente modulariza el backend por dominio
  (AnimalModule, GanadoModule, PotreroModule, VentaModule, etc.) dentro de un
  solo proceso NestJS — esto da **separación de responsabilidades sin el costo
  operativo de microservicios** (orquestación, comunicación entre servicios,
  múltiples despliegues, observabilidad distribuida).
- Con 1 finca piloto y 1-3 usuarios de campo, la escala no justifica microservicios;
  el costo de infraestructura y complejidad de despliegue sería desproporcionado
  frente al beneficio.
- **Camino de escalamiento futuro:** si el producto crece a "escala real" (como
  se definió en el PRD), los módulos ya separados internamente facilitan
  **extraer microservicios específicos más adelante** (ej. separar el módulo de
  Alertas/Notificaciones si el volumen de WhatsApp/SMS lo justifica) sin
  rediseñar todo desde cero.

### 1.4 REST vs. GraphQL

**Recomendación: REST.** GraphQL aporta valor principalmente cuando hay consumo
muy heterogéneo de datos desde múltiples clientes con necesidades muy distintas
de qué campos pedir — no es el caso aquí (web y móvil consumen datos similares,
con diferencias de rol más que de "forma" de los datos). REST con NestJS es más
simple de versionar, cachear y depurar para un equipo pequeño.

---

## 2. Modelo de datos

### 2.1 Correcciones sobre el diagrama de clases original

Antes de listar el modelo final, se documentan las correcciones acordadas tras
el análisis de abogado del diablo del diagrama original y los hallazgos de los
documentos de UI/UX y Flujo:

| Hallazgo original | Corrección aplicada |
|---|---|
| `Animal` ↔ `Toro`/`Vaca` tenía Generalization **y** Association simultánea | Se elimina la Association duplicada. La única relación es herencia (`Toro`, `Vaca`, `Becerro` extienden `Animal`). |
| Sin genealogía (madre/padre del becerro) | `Becerro` agrega relación 1 a 1 con `Reproduccion` (de la cual hereda madre=Vaca, padre=Toro). |
| `MovimientoGanado` ↔ `Potrero` duplicada sin rol | Se nombran explícitamente `potreroOrigen` y `potreroDestino` como dos relaciones distintas. |
| Sin entidad de Costos/Gastos | Se agrega `Gasto` (categorizado, con flujo de aprobación). |
| `Venta` sin estado de aprobación | Se agrega campo `estado` (`pendiente_aprobacion`, `aprobado`, `rechazado`) + escalamiento de 3 niveles (ver 2.2). |
| Cero métodos/operaciones en el diagrama original | Se definen operaciones clave por clase (ver 2.3) — deja de ser un ERD disfrazado de UML. |
| `Alerta` solo se origina desde `Animal` | Se generaliza el origen de `Alerta` (puede originarse desde Animal, Venta, Gasto — ver 2.2). El origen desde hardware de seguridad/potrero queda fuera de alcance de este MVP (PRD, sección 1.3), pero el modelo no debe cerrar la puerta a futuro. |
| Alerta automática de peso anómalo (diseñada en Flujo, sección 5) | **Movida a Fase 2** tras revisión de riesgo del PRD — el MVP solo persiste `HistorialPeso`, sin el cálculo de umbral ni la generación de Alerta asociada. |
| Vista de Potreros en tiempo real | **Movida a Fase 2** — el MVP conserva `MovimientoGanado` como registro histórico, sin garantía de reflejar la ubicación actual real. |

### 2.2 Entidades principales (resumen, MVP)

> Nota: se omiten aquí los atributos ya correctos del diagrama original
> (id, fechas, etc.) — se listan solo los cambios y entidades nuevas relevantes.

**Tenant / Finca**
- Toda entidad de negocio (Animal, Ganado, Potrero, Venta, Gasto, Usuario, etc.)
  debe llevar `fincaId` desde el modelo de datos base — **no como migración
  futura**. Esto es la base del aislamiento multi-tenant (PRD, sección 1.3).

**Usuario**
- Se mantiene `Rol` (Dueño, Mayordomo, Trabajador de campo) — ya existía en el
  diagrama original como `Rol`/`TipoRol`.
- Se agrega `telefono` (necesario para notificación WhatsApp/SMS, Flujo 4.4).
- Se agrega `delegadoUsuarioId` (nullable, solo relevante para Usuarios con rol
  Dueño) y `diasPlazoNivel1` / `diasPlazoNivel2` (configurables por finca, ver
  Flujo, hallazgo 8) para el escalamiento de aprobaciones.

**Becerro** *(modificada)*
- Se agrega `reproduccionId` (relación 1 a 1 con `Reproduccion`), de la cual se
  derivan `madreId` y `padreId` sin necesidad de digitarlos de nuevo.

**Venta** *(modificada)*
- Se agrega `estado` (enum: `pendiente_aprobacion`, `aprobado`, `rechazado`).
- Se agrega `nivelEscalamiento` (1, 2 o 3 — ver Flujo, sección 1).
- Se agrega `autoAprobado` (booleano, permanente — alimenta la métrica de éxito
  del PRD sobre % de aprobaciones resueltas sin auto-aprobación).
- Se agrega `creadoPorUsuarioId`, `aprobadoPorUsuarioId` (nullable, puede ser
  el Dueño o el Delegado), `motivoRechazo` (nullable).

**Gasto** *(nueva entidad)*
- `id`, `fincaId`, `fecha`, `monto`, `categoria` (enum: insumos, nómina,
  veterinario, otro — ajustable), `descripcion`, `estado`, `nivelEscalamiento`,
  `autoAprobado` (mismos campos que Venta), `creadoPorUsuarioId`,
  `aprobadoPorUsuarioId`, `motivoRechazo`.

**MovimientoGanado** *(modificada)*
- `potreroOrigenId`, `potreroDestinoId` — explícitos, ya no ambiguos.

**HistorialPeso** *(sin cambios estructurales, pero alimenta lógica de Flujo 5)*

**Alerta** *(generalizada)*
- `tipoOrigen` (enum: `animal`, `venta`, `gasto` — extensible a futuro sin
  romper el modelo).
- `referenciaId` (UUID genérico al registro que originó la alerta, interpretado
  según `tipoOrigen`).

### 2.3 Operaciones clave por clase (resolviendo el hallazgo de "cero métodos")

Se listan las operaciones de dominio mínimas que deben existir como
comportamiento, no solo como lógica suelta en servicios del backend:

- `Animal.calcularEdad()`
- `Animal.registrarPeso(peso, fecha)` → en el MVP solo persiste el dato; la
  evaluación de umbral y disparo de `Alerta` por peso anómalo es Fase 2
- `Vaca.confirmarParto(resultado)` → cierra `Reproduccion`, opcionalmente crea `Becerro`
- `Reproduccion.calcularFechaProbableParto()`
- `Potrero.capacidadDisponible()` → usado en el flujo de validación de Movimiento
- `Venta.aprobar(usuarioId)` / `Venta.rechazar(usuarioId, motivo)`
- `Venta.escalar()` → avanza `nivelEscalamiento`, ejecutado por un job
  programado que revisa plazos vencidos, no por acción directa de usuario
- `Gasto.aprobar(usuarioId)` / `Gasto.rechazar(usuarioId, motivo)` / `Gasto.escalar()`
- `Ganado.moverA(potreroDestino)`

---

## 3. Autenticación y control de acceso

- **Autenticación:** JWT, gestionado por `AuthModule` (ya existente en el
  diagrama de arquitectura).
- **Autorización:** basada en rol (`Dueño`, `Mayordomo`, `Trabajador de campo`,
  y el caso especial de `Delegado` — ver 2.2) **a nivel de API**, no solo de UI
  — replicando la matriz de permisos definida en UI/UX, sección 3. Ningún
  endpoint financiero debe ser alcanzable por el rol Trabajador de campo,
  incluso si conoce la URL directamente.
- **Multi-tenant:** todo middleware/guard de autorización debe validar también
  que el `fincaId` del recurso solicitado coincide con el `fincaId` del usuario
  autenticado — aislamiento de datos entre fincas clientes.
- **Job de escalamiento:** proceso programado (cron job dentro del backend
  monolítico, no un servicio separado en esta etapa) que revisa periódicamente
  `Venta`/`Gasto` en `pendiente_aprobacion` cuyo plazo de nivel actual venció,
  y ejecuta `escalar()` — disparando a su vez la notificación correspondiente
  (Flujo, sección 1).

---

## 4. Integraciones externas

| Integración | Propósito | Notas |
|---|---|---|
| WhatsApp Business API / SMS (ej. Twilio o BSP local) | Notificación de alertas importantes (Flujo 4.4) | Mismo patrón ya explorado en proyectos previos de CRM/WhatsApp del autor |
| Báscula electrónica (lector RFID) | Registro automático de peso | Requiere definir protocolo de integración con el hardware (serial/Bluetooth/API del fabricante) — **pendiente de especificar una vez se elija el modelo de báscula** |

---

## 5. Escalabilidad esperada

| Horizonte | Usuarios esperados | Fincas (tenants) |
|---|---|---|
| Piloto (0-3 meses) | 1-3 trabajadores + 1 mayordomo + 1 dueño por finca piloto | 1 |
| 6 meses | Validación con fincas adicionales interesadas (PRD, métrica de éxito) | 2-5 |
| 12 meses+ | Escala de producto real (objetivo declarado) | Decenas, arquitectura debe soportarlo sin rediseño mayor |

El monolito modular con `fincaId` desde el inicio (sección 2.2) soporta este
crecimiento sin requerir microservicios hasta que el volumen real lo justifique.

---

## 6. Infraestructura y CI/CD (análisis abierto, no decidido aún)

### Opción A — Vercel + Supabase/Railway (stack habitual del autor)

**A favor:**
- Despliegue rápido, ya dominado, bajo costo inicial — ideal para validar el
  piloto sin invertir tiempo en aprender infraestructura nueva.
- Supabase da PostgreSQL + Auth + Storage gestionado, reduciendo trabajo de
  backend en funciones auxiliares.

**En contra (abogado del diablo):**
- Si el producto realmente escala a "decenas de fincas" como se proyecta, Vercel/
  Supabase puede volverse más costoso por uso que una arquitectura propia en AWS,
  y hay menos control fino sobre aislamiento de datos multi-tenant a nivel de
  infraestructura (aunque a nivel de aplicación ya se resuelve con `fincaId`).
- Railway y Supabase, en general, dan menos garantías contractuales/SLA que AWS
  para un producto que se va a vender a terceros (un cliente finca puede preguntar
  por garantías de disponibilidad que son más fáciles de ofrecer en AWS).

### Opción B — AWS

**A favor:**
- Mayor control de infraestructura, mejor para escalar a "producto real" con
  garantías más sólidas frente a clientes pagos.
- Coincide con el aprendizaje que el autor ya está priorizando (AWS Cloud
  Practitioner → Solutions Architect Associate) — desarrollar el TRD sobre AWS
  sería también una oportunidad de aplicar ese conocimiento en un proyecto real.

**En contra:**
- Mayor curva de configuración y mayor costo de tiempo de desarrollo inicial —
  para un piloto de 1 finca, es probablemente sobre-ingeniería en esta etapa,
  el mismo patrón de riesgo que identificamos antes con microservicios prematuros.

### Recomendación para el piloto, dejando la puerta abierta a fase 2

Se recomienda **iniciar en Vercel + Supabase/Railway** para el piloto (validar
producto rápido y barato, consistente con el principio de no sobre-invertir antes
de validar), y **migrar a AWS si y cuando** la validación de "fincas adicionales
interesadas" (métrica de éxito del PRD) confirme que el producto va a escalar
de verdad. Esta migración es factible porque el modelo de datos y la arquitectura
modular no están atados a primitivas específicas de Supabase más allá de
PostgreSQL estándar.

**Esta sigue siendo una decisión abierta** — se documenta el análisis, no se
cierra unilateralmente, dado que el dueño del producto indicó que aún no la ha
decidido.

---

## 7. Resumen de decisiones pendientes (no bloquean el inicio del MVP, pero deben resolverse pronto)

1. Flutter vs. React Native — recomendación dada (React Native), confirmar antes
   de iniciar desarrollo móvil.
2. Vercel/Supabase vs. AWS — análisis abierto, recomendación de empezar simple
   y migrar si se valida escala.
3. Modelo y protocolo de integración con báscula electrónica — depende de qué
   hardware específico se compre.
4. Umbrales zootécnicos para alertas de peso anómalo (Flujo, sección 5,
   **Fase 2**) — requiere validación con mayordomo/veterinario, no es una
   decisión de ingeniería de software.
5. Modelo de negocio/pricing — sigue pendiente desde el PRD, no bloquea
   desarrollo del MVP pero sí bloquea diseño de facturación en fase 2.
6. **Plazos exactos de cada nivel del escalamiento de aprobaciones** (cuántos
   días sin respuesta antes de avanzar de Nivel 1 a 2, y de 2 a 3) — pendiente
   de definir con el dueño piloto (PRD, sección 3).
7. **Quién puede ser Delegado y qué tanto acceso financiero se le otorga** —
   queda como configuración del Dueño al momento de activarlo, no fija en
   este documento (UI/UX, sección 3).
