# PRD — Sistema Inteligente de Gestión Ganadera
### Product Requirements Document

**Versión:** 1.0
**Fecha:** Junio 2026
**Autor:** Diego — JZSolutions

---

## 1. Problema y para quién

### 1.1 El problema
Los ganaderos de doble propósito en Colombia gestionan su hato con **Excel, cuadernos
de campo o memoria** — sin visibilidad real y oportuna de tres cosas que determinan
si el negocio es rentable:

1. **Cuántos animales tienen realmente** (inventario confiable, sin doble conteo ni
   animales "perdidos" en el registro).
2. **Cuánto producen y cuánto valen** (peso, reproducción, calidad) en el tiempo.
3. **Cuánto ganan o pierden** — la pregunta que más le interesa al dueño y que hoy
   responde "a ojo" o revisando cuadernos sueltos al final del mes.

El dueño de finca típicamente no está físicamente en el potrero todos los días; su
mayordomo y trabajadores de campo sí, pero ellos no tienen ninguna herramienta digital
para registrar lo que observan en el momento (peso, parto, movimiento, venta) — el dato
se pierde o se transcribe tarde y con errores.

### 1.2 Para quién (perfiles de usuario)

| Perfil | Rol en el sistema | Contexto de uso |
|---|---|---|
| **Dueño / administrador** | Visibilidad financiera y de hato completa | Web, principalmente desde oficina/casa, revisa reportes y dashboard |
| **Mayordomo / capataz** | Gestión operativa del hato, supervisa trabajadores | Web y móvil, en finca y desde casa |
| **Trabajador de campo** | Registro de eventos en terreno (peso, movimiento, salud, parto) | Móvil, en el potrero, **con o sin señal celular** |

### 1.3 Naturaleza del producto
Este sistema nace para una finca propia (despliegue piloto en los Llanos Orientales,
con buena señal celular) pero está **diseñado desde el inicio como producto
multi-tenant** para ofrecerse a otras fincas. Esta decisión de alcance tiene
implicaciones directas en arquitectura (ver TRD) y en el modelo de datos (toda entidad
debe estar aislada por finca/tenant desde el día uno, no como migración futura).

> **Fuera de alcance de este PRD:** seguridad antirrobo (cerco monitoreado, cámaras,
> RFID perimetral) y pastoreo físico (cercos eléctricos, rotación de potreros como
> hardware). Esas capas, definidas en el modelo de 7 capas previo, son **hardware
> independiente del software** y no forman parte del alcance funcional de este
> producto. El software cubre exclusivamente **gestión de hato** — inventario,
> reproducción, peso, ventas, alertas y contabilidad.

---

## 2. Casos de uso principales (User Stories)

Organizadas por la métrica de éxito definida: **que el dueño sepa cuánto gana y
cuánto vende**, de manera real y oportuna.

### Épica A — Inventario y trazabilidad del hato

- **US-01.** Como dueño, quiero ver en cualquier momento cuántas cabezas tengo,
  desagregadas por categoría (vacas, toros, becerros), para saber el tamaño real
  de mi hato sin tener que contar físicamente.
- **US-02.** Como trabajador de campo, quiero registrar un animal nuevo (nacimiento
  o compra) desde el celular en el potrero, sin necesidad de señal en ese momento.
- **US-03.** Como dueño, quiero ver el historial completo de un animal (nacimiento,
  pesos, movimientos, reproducción, venta o muerte) en una sola vista.
- **US-04.** Como dueño, quiero conocer la genealogía básica de cada becerro (madre
  y padre) para tomar decisiones de cruce y evitar consanguinidad.

### Épica B — Manejo de peso y salud

- **US-05.** Como trabajador de campo, quiero registrar el peso de un animal al
  pasar por la báscula, vinculado a su identificación.
- **US-06.** Como dueño o mayordomo, quiero recibir una alerta automática cuando
  un animal no ha ganado peso en el tiempo esperado, o cuando hay una caída brusca.
  *(Fase 2 — ver sección 3: requiere umbrales zootécnicos validados que no existen
  hoy; el MVP entrega el registro e historial de peso, sin la alerta automática.)*
- **US-07.** Como mayordomo, quiero registrar la mortalidad de un animal con su causa,
  para tener trazabilidad sanitaria.

### Épica C — Reproducción

- **US-08.** Como mayordomo, quiero registrar un evento de reproducción (monta,
  inseminación) entre un toro y una vaca específicos.
- **US-09.** Como dueño, quiero recibir una alerta cuando se acerca la fecha probable
  de parto de una vaca.
- **US-10.** Como dueño, quiero que el sistema registre automáticamente al becerro
  nacido como resultado de una reproducción, vinculándolo a sus padres.

### Épica D — Ventas y contabilidad (la épica que resuelve la métrica de éxito)

- **US-11.** Como dueño, quiero registrar una venta de uno o varios animales, con
  comprador, valor y fecha.
- **US-12.** Como dueño, quiero ver un reporte de ingresos por ventas en un rango
  de fechas (mes, trimestre, año).
- **US-13.** Como dueño, quiero ver el valor comercial estimado de mi hato actual
  (animales vivos, no vendidos) para saber cuánto vale mi inventario en cualquier
  momento.
- **US-14.** Como dueño, quiero un reporte que cruce ingresos por ventas contra una
  estimación de costos, para saber si estoy ganando o perdiendo en un período dado.
- **US-14b.** Como dueño o mayordomo, quiero registrar gastos operativos
  (insumos, nómina, veterinario, etc.) categorizados, para que se reflejen en el
  reporte de ingresos vs. costos.
- **US-14c.** Como dueño, quiero filtrar el reporte de gastos por categoría y
  rango de fechas, para entender en qué se concentra el costo del hato.
- **US-14d.** Como mayordomo, quiero registrar ventas y gastos aunque queden
  pendientes de aprobación del dueño, para no detener mi trabajo en campo.
- **US-14e.** Como dueño, quiero aprobar o rechazar (con motivo opcional) las
  ventas y gastos registrados por el mayordomo, para mantener control financiero
  sin tener que registrar todo personalmente.
- **US-14f.** Como dueño, quiero recibir notificación por WhatsApp/SMS cuando
  haya una venta o gasto pendiente de mi aprobación, o una alerta de salud/parto
  importante, ya que no siempre estoy revisando la app.
- **US-14g.** Como dueño, quiero un mecanismo escalonado si no respondo a una
  aprobación pendiente: primero recordatorios repetidos, luego la posibilidad de
  que un delegado de confianza apruebe en mi nombre, y como último recurso,
  auto-aprobación tras un plazo definido — para que el reporte financiero
  (métrica de éxito principal) nunca quede incompleto por falta de respuesta mía.
  *(Ver sección 3 y documento de Flujo para el detalle de los tres niveles.)*

### Épica E — Movimiento y potreros (gestión lógica, no hardware)

- **US-15.** Como trabajador de campo, quiero registrar el movimiento de un grupo
  de animales (Ganado) de un potrero a otro, indicando origen y destino.
- **US-16.** Como dueño, quiero ver qué animales están en qué potrero en este momento.
  *(Fase 2 — ver sección 3: el MVP conserva el registro histórico de movimientos,
  pero no garantiza que la ubicación mostrada esté siempre actualizada, dado que
  el ganado se mueve entre potreros sin que necesariamente alguien lo registre
  cada vez.)*

### Épica F — Usuarios y roles

- **US-17.** Como dueño, quiero crear cuentas para mis trabajadores con permisos
  limitados (solo registro, sin ver reportes financieros).
- **US-18.** Como administrador de plataforma (JZSolutions), quiero que cada finca
  cliente tenga sus datos completamente aislados de las demás.

---

## 3. MVP vs. Fase 2

> **Nota de alcance (revisada):** la primera versión de este PRD definía un MVP
> amplio (web + móvil, CRUD + reportes + alertas + genealogía, todo desde el
> lanzamiento). Una revisión de tipo "abogado del diablo" identificó que varios
> de esos componentes dependen de condiciones que **no se cumplen de forma
> confiable en el campo real**:
>
> - La **alerta de peso anómalo** requiere umbrales zootécnicos calibrados que
>   hoy no existen — lanzarla sin calibrar genera ruido o falsos positivos desde
>   el día uno.
> - La **vista de potreros en tiempo real** asume que todo movimiento de ganado
>   se registra en el sistema, cuando en la práctica el ganado se mueve solo
>   entre potreros sin que nadie lo documente la mayoría de las veces — la vista
>   estaría desactualizada constantemente, no como excepción.
> - Las **aprobaciones pendientes** (Venta/Gasto creados por el Mayordomo) podían
>   acumularse indefinidamente si el Dueño no respondía, dejando incompleta
>   justo la métrica de éxito principal del proyecto.
>
> Tras esa revisión, se decidió **recortar selectivamente el MVP**: se mantiene
> la genealogía automática (decisión explícita del dueño del producto, a pesar
> del riesgo identificado de que no toda monta se observa y registra a tiempo —
> se documenta como limitación conocida, no se resuelve en este MVP), se baja a
> Fase 2 la alerta automática de peso y la vista de potreros en tiempo real, y
> se añade un mecanismo de escalamiento de tres niveles para que las
> aprobaciones nunca dejen el reporte financiero incompleto.

### MVP (lanzamiento piloto)

| Incluido | Épica |
|---|---|
| Registro y consulta de animales (CRUD completo) | A |
| Genealogía básica (madre/padre del becerro, vía Reproducción) | A |
| Registro de peso vía báscula/manual (sin alerta automática) | B |
| Registro de mortalidad | B |
| Registro de reproducción y alertas de parto próximo | C |
| Registro de becerro vinculado a reproducción | C |
| Registro de ventas, con flujo de aprobación | D |
| Registro de gastos operativos categorizados, con flujo de aprobación | D |
| Reportes de ingresos por ventas | D |
| Valor comercial estimado del hato (calculado + override manual) | D |
| Reporte cruzado ingresos vs. costos, con filtros por categoría | D |
| **Escalamiento de aprobaciones pendientes (3 niveles, ver abajo)** | D |
| Registro de movimiento entre potreros (histórico, sin vista en tiempo real) | E |
| Roles: Dueño, Mayordomo, Trabajador de campo | F |
| Multi-tenant (aislamiento de datos por finca) | F |
| App móvil con funcionamiento offline y sincronización | — |
| Web responsive para dueño/mayordomo | — |

**Detalle del escalamiento de aprobaciones (US-14g), los tres niveles operan en
secuencia, no como alternativas:**

1. **Nivel 1 — Recordatorio repetido:** notificación WhatsApp/SMS al Dueño cada
   cierto número de días mientras la aprobación esté pendiente.
2. **Nivel 2 — Delegado de confianza:** si el Dueño configuró un delegado (ej.
   un familiar o socio), este puede aprobar/rechazar en su nombre tras un primer
   plazo sin respuesta.
3. **Nivel 3 — Auto-aprobación de último recurso:** si tras un plazo mayor
   ninguno de los anteriores actuó, el sistema aprueba automáticamente para que
   el reporte financiero no quede incompleto, dejando registro explícito de que
   fue una auto-aprobación (no una decisión humana) para que el Dueño pueda
   revisarla después si lo desea.

> Los plazos exactos de cada nivel (cuántos días) quedan **pendientes de
> definir con el dueño piloto** — no se fija un número arbitrario aquí.

### Fase 2 (post-piloto, explícitamente fuera del MVP)

- **Alerta automática de peso anómalo** — requiere validar umbrales zootécnicos
  reales con mayordomo/veterinario antes de activarla (el MVP solo registra
  peso e historial, sin disparar alertas).
- **Vista de potreros en tiempo real** — el MVP conserva el registro histórico
  de movimientos, pero no la garantía de que la ubicación mostrada esté siempre
  al día.
- Integración de alertas provenientes del hardware de seguridad (cerco monitoreado,
  cámaras) — el software *recibiría* alertas, no las genera.
- Pastoreo asistido (recomendación automática de rotación de potreros).
- Proyecciones predictivas (ya contempladas como entidad `Proyeccion` en el modelo
  de datos, pero su lógica de cálculo queda para fase 2).
- Reportes financieros avanzados (flujo de caja proyectado, comparativos entre
  fincas para el dueño con más de una finca).
- Marketplace o integración con compradores/frigoríficos.
- Panel de administración multi-finca para JZSolutions (gestión de clientes,
  facturación, soporte).
- Definición de modelo de negocio/precios (pendiente, ver sección 6).

---

## 4. Métricas de éxito

La métrica rectora, definida explícitamente por el dueño del producto:

> **"Que el dueño sepa realmente la parte administrativa: cuánto gana y cuánto vende."**

Esto se traduce en métricas medibles para validar el MVP:

| Métrica | Cómo se mide | Meta piloto (a definir con dueño real) |
|---|---|---|
| Visibilidad financiera | El dueño puede responder "¿cuánto vendí este mes?" sin salir del sistema | 100% de las ventas del piloto registradas en el sistema, no en cuaderno aparte |
| **Aprobaciones resueltas sin llegar a auto-aprobación** | % de Ventas/Gastos pendientes que el Dueño o su delegado resuelven en Nivel 1 o 2, sin llegar al Nivel 3 (auto-aprobación) | ≥ 90% — un porcentaje alto de auto-aprobaciones señalaría que el flujo de aprobación no está funcionando como control real |
| Adopción de campo | % de trabajadores que registran al menos 1 evento/semana | ≥ 80% en las primeras 4 semanas |
| Confiabilidad de inventario | Diferencia entre conteo físico y conteo del sistema | < 5% de discrepancia en el conteo de control |
| Latencia de sincronización offline | Tiempo entre registro en campo sin señal y reflejo en el sistema al recuperar señal | < 5 minutos tras recuperar conectividad |
| Interés comercial (validación de producto) | Número de fincas adicionales (no la piloto) interesadas en usarlo tras la demo | ≥ 1 finca adicional interesada, como señal mínima de validación |

> **Pendiente de definir con el dueño de la finca piloto:** metas numéricas exactas
> (ej. "80% de adopción" es una meta sugerida, no confirmada) — se recomienda
> fijarlas junto con el cliente piloto antes del lanzamiento, no de forma unilateral.

---

## 5. Decisiones confirmadas (resueltas tras revisión con el dueño)

Estas preguntas quedaron abiertas en la primera versión de este PRD y ya están
resueltas:

1. **Tamaño del piloto:** 1–3 trabajadores de campo usarán la app inicialmente.
   El diseño de permisos y la carga de soporte se calibran para este volumen, no
   para decenas de usuarios simultáneos.

2. **Valor comercial del animal:** modelo **híbrido**. El sistema calcula un valor
   comercial **estimado automáticamente** (con base en peso actual, raza y calidad
   de carne como mínimo) y el administrador **puede sobrescribirlo manualmente**
   por animal cuando lo considere necesario (ej. negociación específica, animal con
   atributo no capturado por el sistema). El sistema debe distinguir y mostrar
   cuándo un valor es "estimado por el sistema" vs. "ajustado manualmente" — esto
   es relevante para el reporte de valor de inventario (US-13).

3. **Alcance de "costo" en el reporte ingresos vs. costos:** se **incluyen gastos
   operativos** (insumos, nómina, veterinario, etc.), no solo compra/venta de
   animales, **con filtros por categoría de gasto**. Esto requiere una nueva
   entidad de dominio — `Gasto` (o `CostoOperativo`) — categorizada, que **no
   existía en el diagrama de clases original** y se incorpora formalmente en el
   TRD (sección de modelo de datos).

4. **Modelo de negocio** (suscripción, por cabeza, etc.) — sigue **pendiente**.
   No bloquea el desarrollo del MVP, pero sí bloquea decisiones de multi-tenant/
   billing en fase 2.

---

## 6. Recorte de alcance tras revisión "abogado del diablo" (resuelto)

Tras presionar cada user story con las preguntas *¿es real? ¿qué pasa si X?
¿esto es MVP o lujo?*, se confirmaron los siguientes cambios de alcance,
detallados en la sección 3:

- **Se mantiene** la genealogía automática en el MVP, por decisión explícita del
  dueño del producto, asumiendo como limitación conocida que no toda monta se
  observará y registrará a tiempo en el campo real.
- **Se baja a Fase 2** la alerta automática de peso anómalo (sin umbrales
  zootécnicos validados, el riesgo de falsos positivos es alto).
- **Se baja a Fase 2** la vista de potreros en tiempo real (el registro de
  movimiento se mantiene en MVP, pero sin garantía de estar siempre actualizado).
- **Se añade al MVP** un mecanismo de escalamiento de tres niveles para
  aprobaciones pendientes (recordatorio → delegado → auto-aprobación), para
  proteger la métrica de éxito principal frente al riesgo de que el Dueño no
  responda a tiempo.
