# UI/UX — Sistema Inteligente de Gestión Ganadera
### Diseño de flujo de usuario y pantallas

**Versión:** 1.0
**Depende de:** 01_PRD.md

---

## 1. Decisión de plataforma: responsive único, no dos experiencias

Se confirma **web responsive como estrategia única** — no se construyen dos
interfaces separadas (una "app de campo" y un "dashboard web"). La misma interfaz
se adapta según el tamaño de pantalla, y **lo que cambia según el dispositivo es el
contexto de uso esperado, no la información disponible** (lo que cambia según
*quién* usa el sistema es el **rol**, no el dispositivo — ver sección 3).

Esto tiene una implicación directa para el TRD: refuerza la decisión de evaluar
un framework cross-platform para móvil que pueda compartir componentes/lógica
con el frontend web, en lugar de Kotlin nativo aislado (ver TRD, sección de stack).

### Por qué responsive y no nativo-first
- El dueño puede estar revisando el reporte de ventas desde el celular en el carro
  y luego seguir en el computador de la oficina — la continuidad de experiencia
  importa más que features nativas de hardware (cámara, GPS) que este MVP no
  necesita explotar a fondo.
- El trabajador de campo sí necesita una experiencia optimizada para **registro
  rápido con guantes/sol/prisa**, pero esto se resuelve con **componentes grandes
  y flujos cortos en el breakpoint móvil**, no con una app completamente distinta.

---

## 2. Mapa de pantallas

```
┌─────────────────────────────────────────────────────────────┐
│                         LOGIN                                │
└───────────────────────────┬───────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │   (según rol del usuario)    │
              └──────────────┬──────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
   DUEÑO / ADMIN        MAYORDOMO          TRABAJADOR DE CAMPO
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌──────────────────┐
│   DASHBOARD    │    │   DASHBOARD    │    │  REGISTRO RÁPIDO │
│  (financiero)  │    │ (operativo,    │    │   (sin reportes  │
│                │    │  sin $$ si se  │    │   financieros)   │
│                │    │  decide así)   │    │                  │
└───────┬────────┘    └───────┬────────┘    └─────────┬────────┘
        │                     │                        │
        ▼                     ▼                        ▼
  ┌─────────────────────────────────────────────────────────┐
  │                    NAVEGACIÓN PRINCIPAL                  │
  │  Animales · Ganado · Potreros · Reproducción · Ventas ·  │
  │  Gastos · Alertas · Usuarios (solo Dueño)                │
  └─────────────────────────────────────────────────────────┘
```

### 2.1 Listado de pantallas (MVP)

| # | Pantalla | Rol(es) con acceso | Plataforma prioritaria |
|---|---|---|---|
| 1 | Login | Todos | Ambas |
| 2 | Dashboard financiero (ventas, gastos, valor de hato) | Dueño | Web, responsive en móvil |
| 3 | Dashboard operativo (inventario, alertas, próximos partos) | Dueño, Mayordomo | Ambas |
| 4 | Listado de Animales (con filtros) | Todos (campos visibles varían) | Ambas |
| 5 | Detalle de Animal (historial completo) | Todos | Ambas |
| 6 | Registro rápido de Animal nuevo | Trabajador, Mayordomo | Móvil prioritario |
| 7 | Registro de Peso | Trabajador, Mayordomo | Móvil prioritario |
| 8 | Registro de Reproducción | Mayordomo | Ambas |
| 9 | Registro de Becerro nacido (vincula a Reproducción) | Mayordomo | Ambas |
| 10 | Registro de Mortalidad | Trabajador, Mayordomo | Móvil prioritario |
| 11 | Listado y registro de Movimiento entre Potreros (histórico) | Trabajador, Mayordomo | Móvil prioritario |
| 12 | ~~Vista de Potreros en tiempo real~~ — **movida a Fase 2** (ver PRD, sección 3) | — | — |
| 13 | Registro de Venta | Dueño, Mayordomo | Web prioritario |
| 14 | Registro de Gasto operativo (categorizado) | Dueño, Mayordomo | Ambas |
| 15 | Reporte Ingresos vs. Gastos (con filtros) | Dueño | Web, responsive en móvil |
| 16 | Centro de Alertas | Dueño, Mayordomo | Ambas |
| 17 | Gestión de Usuarios y Roles | Dueño | Web |
| 18 | Sincronización pendiente (cola offline) | Trabajador, Mayordomo | Móvil |
| 19 | **Pendientes de aprobación** (ventas/gastos del Mayordomo) | Dueño, Delegado | Ambas |
| 20 | **Configuración de delegado de aprobación** | Dueño | Web |

> El Mayordomo registra ventas/gastos en estado `pendiente_aprobacion` (confirmado
> con el dueño del producto). El control de acceso real para estas pantallas se
> implementa según la matriz de la sección 3.

---

## 3. Permisos por rol (matriz de visibilidad)

Esta matriz es la base directa del control de acceso a implementar en el backend
(no solo ocultar en el frontend — debe aplicarse también a nivel de API, ver TRD).

| Módulo / Dato | Dueño | Mayordomo | Trabajador de campo | Delegado* |
|---|---|---|---|---|
| Ver inventario de animales | ✅ | ✅ | ✅ | ✅ |
| Editar/crear animal | ✅ | ✅ | ✅ (solo creación, no edición de históricos) | — |
| Ver historial de animal | ✅ | ✅ | ✅ | ✅ |
| Registrar peso | ✅ | ✅ | ✅ | — |
| Registrar reproducción | ✅ | ✅ | ❌ | — |
| Registrar mortalidad | ✅ | ✅ | ✅ | — |
| Registrar movimiento entre potreros | ✅ | ✅ | ✅ | — |
| **Ver valor comercial del animal** | ✅ | ✅ | ❌ | ✅ |
| **Registrar ventas** | ✅ (directo) | ✅ (queda en estado "pendiente de aprobación") | ❌ | — |
| **Registrar gastos** | ✅ (directo) | ✅ (queda en estado "pendiente de aprobación") | ❌ | — |
| **Aprobar/rechazar ventas o gastos registrados por Mayordomo** | ✅ | ❌ | ❌ | ✅ (solo si el Dueño no respondió en Nivel 1, ver Flujo 4.0) |
| **Ver reporte ingresos vs. gastos** | ✅ | ❌ | ❌ | ⚠️ depende de si el Dueño le da ese permiso al configurar el delegado |
| **Ver dashboard financiero** | ✅ | ❌ | ❌ | ⚠️ idem |
| Gestionar usuarios y roles | ✅ | ❌ | ❌ | ❌ |
| Ver alertas | ✅ | ✅ | ✅ (solo las relevantes a su tarea) | ✅ (solo aprobaciones) |

> **\*Delegado:** rol opcional, configurado por el Dueño (pantalla #20). No es
> un rol permanente del sistema como los otros tres — existe únicamente como
> respaldo del flujo de aprobación (Nivel 2 de escalamiento, ver Flujo 4.0). El
> alcance exacto de lo que el Dueño le permite ver al configurar el delegado
> queda como decisión del Dueño al momento de configurarlo, no fija en este
> documento.

**Regla de diseño explícita:** ningún dato con prefijo financiero (valor comercial,
venta, gasto, reporte) se renderiza para el rol Trabajador de campo — esto no es
una ocultación visual (CSS), es una decisión de qué datos llegan siquiera en la
respuesta de la API a ese rol.

**Regla de aprobación:** toda Venta o Gasto registrado por un Mayordomo nace con
estado `pendiente_aprobacion`. Solo cuenta para los reportes financieros del
Dueño (Dashboard, Reporte Ingresos vs. Gastos) una vez el Dueño la **aprueba**.
Si la rechaza, el registro queda visible como `rechazado` con motivo opcional,
visible para el Mayordomo que lo creó (para que sepa que debe corregir y
reenviar), pero no se contabiliza en ningún reporte.

---

## 4. Flujos de usuario clave

### 4.0 Flujo: Mayordomo registra Venta/Gasto → aprobación con escalamiento de 3 niveles

Este flujo se amplió tras una revisión de riesgo: si el Dueño nunca responde,
el reporte financiero (métrica de éxito principal del proyecto) queda
incompleto indefinidamente. El escalamiento evita ese punto de falla.

```
Mayordomo registra una Venta o Gasto
        │
        ▼
Sistema guarda con estado = "pendiente_aprobacion"
        │
        ▼
┌─────────────────────── NIVEL 1 ───────────────────────┐
│  Dueño recibe notificación in-app + WhatsApp/SMS        │
│  Se repite cada N días mientras siga pendiente          │
│  (N a definir con el dueño piloto)                       │
└──────────────────────────┬───────────────────────────────┘
                            │
              ┌──────────── ┴ ────────────┐
              ▼ (Dueño actúa)             ▼ (sin respuesta tras plazo 1)
   ┌─────────────────┐         ┌──────────────────────────────┐
   │ aprobado /       │         │       NIVEL 2                │
   │ rechazado        │         │  Si hay Delegado configurado: │
   │ (por el Dueño)   │         │  recibe la misma notificación │
   └─────────────────┘         │  y puede aprobar/rechazar      │
                                 │  en nombre del Dueño           │
                                 └──────────────┬─────────────────┘
                                                │
                                  ┌─────────────┴─────────────┐
                                  ▼ (Delegado actúa)          ▼ (sin Delegado, o sin respuesta tras plazo 2)
                       ┌─────────────────┐         ┌──────────────────────────┐
                       │ aprobado /       │         │        NIVEL 3            │
                       │ rechazado        │         │  Auto-aprobación de        │
                       │ (por el Delegado)│         │  último recurso             │
                       └─────────────────┘         │  estado = "aprobado",        │
                                                      │  con marca explícita         │
                                                      │  "auto-aprobado, sin         │
                                                      │  revisión humana" para que   │
                                                      │  el Dueño la audite después  │
                                                      └──────────────────────────┘
```

**Reglas del flujo:**
- Solo se avanza de nivel si el anterior **no tuvo respuesta** dentro del plazo
  configurado — no es una alternativa a elección, es secuencial.
- Una Venta o Gasto **rechazado** en cualquier nivel detiene el escalamiento;
  el Mayordomo ve el motivo y debe crear un nuevo registro (no se edita el
  rechazado, igual que en la versión anterior de este flujo).
- Todo registro que llegue a Nivel 3 (auto-aprobación) queda marcado de forma
  permanente y visible como tal — nunca se mezcla silenciosamente con una
  aprobación humana real, porque eso rompería la confiabilidad del reporte
  financiero que es la métrica de éxito del proyecto.
- Si el creador del registro es el Dueño directamente (no el Mayordomo), nace
  ya en estado `aprobado` — este flujo de tres niveles aplica solo a lo creado
  por el Mayordomo.

### 4.1 Flujo: Trabajador registra peso sin señal (offline)

```
Trabajador abre app en potrero (sin señal)
        │
        ▼
Selecciona animal (de caché local, ya sincronizado antes)
        │
        ▼
Ingresa peso + fecha (automática)
        │
        ▼
Sistema guarda en cola local (IndexedDB / almacenamiento local del dispositivo)
        │
        ▼
Muestra confirmación visual: "Guardado, pendiente de sincronizar"
        │
        ▼
[Trabajador sigue trabajando, repite para más animales]
        │
        ▼
Dispositivo recupera señal (automático, en background)
        │
        ▼
App sincroniza cola pendiente con el backend
        │
        ▼
¿Hay conflicto? (ej. otro usuario editó el mismo animal mientras estaba offline)
        │
        ├──► No hay conflicto → Confirmación: "Sincronizado"
        │
        └──► Sí hay conflicto → Sistema NO sobrescribe automáticamente
                    │
                    ▼
        Muestra ambas versiones al usuario (la suya offline vs. la que ya
        está en el servidor) y pide resolución manual: cuál conservar, o
        fusionar campos específicos
                    │
                    ▼
        Usuario resuelve → se sincroniza la versión final elegida
        │
        ▼
Confirmación: "Sincronizado" — el peso queda en el historial del animal
(la alerta automática de peso anómalo es Fase 2, ver PRD sección 3; en el
MVP el dato queda disponible para consulta y gráfico de tendencia, sin
disparar notificación)
```

### 4.4 Flujo: Notificación de alerta importante (multicanal)

```
Sistema detecta evento que dispara alerta
(parto próximo, venta/gasto pendiente de aprobación — incluyendo los 3
niveles de escalamiento del flujo 4.0)
        │
        ▼
Se crea registro de Alerta en el sistema (visible en Centro de Alertas, in-app)
        │
        ▼
¿Es una alerta de las categorías "importantes"?
(parto próximo, pendiente de aprobación en cualquiera de sus 3 niveles)
        │
        ▼
Sí → Se envía también por WhatsApp/SMS al Dueño (y Mayordomo o Delegado
     según corresponda al nivel), usando el número de contacto registrado
     en su perfil de Usuario
        │
        ▼
Dueño/Delegado puede actuar directamente desde el enlace en el mensaje (si
aplica, ej. ir directo a aprobar una Venta) o abrir la app
```

> **Nota sobre alcance:** la alerta de peso anómalo, mencionada en versiones
> anteriores de este flujo, **se movió a Fase 2** (ver PRD, sección 3) — no
> dispara notificación en el MVP, dado que los umbrales zootécnicos para
> definir qué es "anómalo" no están validados todavía.

> **Nota técnica para el TRD:** esto requiere integración con un proveedor de
> WhatsApp Business API o SMS (ej. Twilio, o un BSP local) — mismo patrón que ya
> se exploró antes para el caso de CRM/WhatsApp con consultorios y
> concesionarios. Debe definirse en el TRD como integración externa.

### 4.2 Flujo: Dueño revisa si está ganando o perdiendo

```
Dueño entra a Dashboard financiero
        │
        ▼
Ve resumen del mes actual: Ingresos (ventas) vs. Gastos (operativos)
        │
        ▼
Ve valor estimado del hato vivo (animales no vendidos)
        │
        ▼
Ve indicador de cuántos registros llegaron a auto-aprobación (Nivel 3) en el
período — señal de que el flujo de control no se está usando como debería si
el número es alto (ver PRD, métrica de "aprobaciones resueltas sin auto-aprobación")
        │
        ▼
¿Quiere más detalle? → Entra a Reporte Ingresos vs. Gastos
        │
        ▼
Filtra por rango de fechas y/o categoría de gasto
        │
        ▼
Ve desglose: cuánto se gastó en veterinario vs. insumos vs. nómina, etc.
        │
        ▼
Exporta o simplemente toma la decisión informada
```

### 4.3 Flujo: Registro de nacimiento con genealogía

```
Mayordomo ve que una Vaca tuvo parto (evento de Reproduccion con resultado="exitoso")
        │
        ▼
Sistema sugiere crear Becerro vinculado a esa Reproduccion específica
        │
        ▼
Mayordomo confirma datos del Becerro (sexo, fecha, peso al nacer)
        │
        ▼
Sistema guarda Becerro con madre y padre ya vinculados automáticamente
(heredados de la Reproduccion, no se vuelven a digitar)
        │
        ▼
Becerro aparece en inventario general, con genealogía visible en su Detalle
```

---

## 5. Componentes compartidos web/móvil

Dado que se confirmó responsive único, el diseño de componentes debe pensarse
como **una sola librería de componentes** con variantes de tamaño, no componentes
duplicados:

- **Formulario de registro rápido** (peso, mortalidad, movimiento): mismo
  componente, pero en breakpoint móvil reduce campos visibles a los
  estrictamente necesarios y usa inputs grandes (pensado para uso con prisa/sol).
- **Tarjeta de Animal**: misma tarjeta en listado, pero en móvil se prioriza
  foto + identificador + estado; en web se muestran más columnas tabulares.
- **Centro de Alertas**: mismo componente de notificación, accesible desde un
  ícono persistente en ambas plataformas.
- **Indicador de sincronización offline**: específico de contexto móvil/campo,
  pero construido como componente reutilizable (podría aparecer también en web
  si en el futuro se permite registro offline desde un portátil sin señal).

---

## 6. Resumen de decisiones que alimentan el documento de Flujo

- El Mayordomo registra Ventas/Gastos en estado `pendiente_aprobacion`; el Dueño
  aprueba o rechaza, con escalamiento de 3 niveles (recordatorio → Delegado →
  auto-aprobación) si no hay respuesta a tiempo.
- Conflictos de sincronización offline se resuelven **manualmente** por el
  usuario, nunca se sobrescribe en automático.
- Las alertas importantes salen también por WhatsApp/SMS, no solo in-app —
  esto implica una integración externa que debe quedar definida en el TRD.
- La alerta automática de peso anómalo y la vista de potreros en tiempo real
  se movieron a Fase 2 tras la revisión de riesgo del PRD (sección 3) — el
  MVP conserva los registros e historiales correspondientes, sin las
  funcionalidades en tiempo real/automáticas asociadas.
