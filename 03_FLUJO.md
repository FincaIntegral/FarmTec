# FLUJO — Sistema Inteligente de Gestión Ganadera
### Arquitectura de flujo y diagramas de proceso

**Versión:** 1.0
**Depende de:** 01_PRD.md, 02_UIUX.md

Este documento traduce los flujos de usuario del documento de UI/UX en **lógica de
sistema explícita**: qué pasa en el backend, qué estados tiene cada entidad clave,
y qué dispara qué.

---

## 1. Diagrama de estados — Venta / Gasto (flujo de aprobación con escalamiento)

Esta es la lógica de negocio más nueva y crítica del MVP (no existía en el
diagrama de clases original; ver hallazgos en sección 7). Se amplió con un
escalamiento de 3 niveles tras identificar que una aprobación nunca resuelta
deja incompleta la métrica de éxito principal del proyecto.

```
                    ┌─────────────────────┐
                    │   Mayordomo crea    │
                    │   Venta o Gasto     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ pendiente_aprobacion │
                    │   nivel = 1          │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼                              ▼
        Dueño responde                 Sin respuesta tras
        dentro del plazo 1              plazo 1 configurado
                │                              │
    ┌───────────┼───────────┐                  ▼
    ▼                       ▼          ┌─────────────────────┐
┌─────────┐         ┌──────────────┐   │ pendiente_aprobacion │
│ aprobado │         │  rechazado    │   │   nivel = 2          │
│(Dueño)   │         │ (Dueño +      │   │  (¿hay Delegado       │
└────┬────┘         │  motivo)      │   │   configurado?)        │
     │              └──────┬───────┘   └──────────┬──────────────┘
     ▼                     │                       │
Entra a reportes           ▼            ┌──────────┼──────────┐
financieros         Mayordomo ve         ▼                      ▼
                     motivo, crea   Delegado responde    Sin Delegado, o
                     NUEVO registro  dentro del plazo 2   sin respuesta tras
                     (no se edita                          plazo 2
                     el rechazado)        │                      │
                                   ┌──────┼──────┐               ▼
                                   ▼             ▼      ┌─────────────────────┐
                              ┌─────────┐ ┌──────────┐  │     NIVEL 3          │
                              │aprobado │ │rechazado │  │  auto-aprobado = true │
                              │(Delegado)│ │(Delegado)│  │  estado = "aprobado"  │
                              └────┬────┘ └────┬─────┘  │  (marca permanente,   │
                                   │            │         │  sin revisión humana) │
                                   ▼            ▼         └──────────┬────────────┘
                          Entra a reportes  Mayordomo ve              │
                          financieros       motivo, crea              ▼
                                            nuevo registro    Entra a reportes
                                                               financieros, marcado
                                                               para auditoría
                                                               posterior del Dueño

REGLA: si el creador es el Dueño directamente (no Mayordomo), el estado nace
       ya en "aprobado", nivel = 0 — el escalamiento solo aplica a registros
       creados por el rol Mayordomo.

REGLA: el campo `auto_aprobado` (booleano) queda en el registro para siempre,
       independientemente de que después se audite — esto es lo que permite
       a la métrica de éxito "% resuelto sin llegar a Nivel 3" del PRD.
```

**Disparadores de notificación en este flujo:**
- `pendiente_aprobacion` (nivel 1) creado → notificación in-app + WhatsApp/SMS al Dueño.
- Escalamiento a nivel 2 (sin respuesta del Dueño) → notificación in-app + WhatsApp/SMS al Delegado, si existe.
- Escalamiento a nivel 3 (auto-aprobación) → notificación in-app al Dueño informando que ocurrió, para que pueda auditar.
- `rechazado` (en cualquier nivel) → notificación in-app al Mayordomo que lo creó.

---

## 2. Diagrama de estados — Animal (ciclo de vida)

```
                    ┌──────────────┐
                    │   Nace /      │
                    │  se registra  │
                    └──────┬───────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │   estadoAnimal =   │
                 │      "activo"      │◄─────────────┐
                 └─────────┬─────────┘               │
                           │                          │
        ┌──────────────────┼──────────────────┐       │
        ▼                  ▼                  ▼       │
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  en_potrero   │  │  en_tratamie-│  │   vendido     │  │
│  (normal)     │  │  nto          │  │  (vía Venta   │  │
│               │  │  (registrado  │  │  aprobada)    │  │
│               │  │  manualmente, │  │               │  │
│               │  │  no por alerta│  │               │  │
│               │  │  automática   │  │               │  │
│               │  │  — eso es     │  │               │  │
│               │  │  Fase 2)      │  │               │  │
└──────┬───────┘  └──────┬───────┘  └──────────────┘  │
       │                  │                            │
       │                  └────────────────────────────┘
       │                  (se resuelve el tratamiento, vuelve a activo)
       ▼
┌──────────────┐
│   muerto      │  (vía registro de Mortalidad — estado terminal)
└──────────────┘

NOTA: "vendido" y "muerto" son estados terminales — el animal deja de aparecer
en inventario activo pero conserva su historial completo (US-03 del PRD).
```

---

## 3. Diagrama de proceso — Registro de Reproducción → Nacimiento → Genealogía

Este es el flujo que resuelve el hueco de genealogía identificado en el análisis
del diagrama de clases original.

```
Mayordomo registra Reproduccion
(selecciona Toro + Vaca específicos, tipo: monta natural / inseminación)
        │
        ▼
Sistema guarda Reproduccion con estado = "en_curso"
        │
        ▼
[Tiempo pasa — sistema calcula fechaProbableParto a partir de fecha + gestación
 promedio de la raza, y genera Alerta cuando se acerca]
        │
        ▼
Mayordomo registra resultado real:
        │
        ├──► resultado = "fallido" → Reproduccion cierra, no se crea Becerro
        │
        └──► resultado = "exitoso"
                    │
                    ▼
        Sistema PRE-LLENA formulario de nuevo Becerro:
          - madre = Vaca de la Reproduccion (automático, no se re-digita)
          - padre = Toro de la Reproduccion (automático, no se re-digita)
          - fechaNacimiento = fecha real del parto
        │
        ▼
        Mayordomo completa datos faltantes (sexo, peso al nacer)
        │
        ▼
        Sistema crea Becerro vinculado a la Reproduccion de origen
        │
        ▼
        Becerro aparece en inventario activo con genealogía consultable
        desde su pantalla de Detalle (US-04)
```

**Decisión de modelado derivada de este flujo:** la entidad `Becerro` necesita
una referencia explícita a la `Reproduccion` que lo originó (relación 1 a 1, no
solo herencia de `Animal`). Esto se incorpora en el modelo de datos del TRD.

---

## 4. Diagrama de proceso — Movimiento entre Potreros

```
Trabajador selecciona Ganado (grupo) a mover
        │
        ▼
Selecciona Potrero ORIGEN (sugerido automáticamente = potrero actual del grupo)
        │
        ▼
Selecciona Potrero DESTINO
        │
        ▼
Sistema valida: ¿el Potrero destino tiene capacidad disponible?
(hectareas vs. cabezas ya asignadas — regla de negocio simple para MVP)
        │
        ├──► No hay capacidad → advertencia, pero permite continuar
        │     (es una alerta informativa, no un bloqueo duro — el ganadero
        │      puede tener razones válidas para sobrepasar la sugerencia)
        │
        └──► Hay capacidad → continúa
                    │
                    ▼
        Sistema crea MovimientoGanado con:
          - potreroOrigen (rol explícito, no ambiguo como en el diagrama
            original — ver hallazgo en sección 4 más abajo)
          - potreroDestino (rol explícito)
          - fechaMovimiento, observacion
        │
        ▼
        Actualiza la ubicación actual del Ganado al Potrero destino
        (en el MVP, este dato queda en el historial de movimientos; la
        pantalla "Vista de Potreros en tiempo real" del UI/UX se movió a
        Fase 2 — ver hallazgo más abajo)
```

**Corrección de modelado respecto al diagrama de clases original:** la relación
`MovimientoGanado` ↔ `Potrero` aparecía dos veces sin diferenciar roles. Este
flujo confirma que se necesitan **dos relaciones nombradas explícitamente**:
`potreroOrigen` y `potreroDestino`, no dos asociaciones genéricas idénticas.

**Nota de alcance (MVP vs. Fase 2):** este diagrama sigue aplicando en el MVP
para el *registro histórico* de movimientos. Lo que se baja a Fase 2 es
únicamente la pantalla que muestra "qué animales están en qué potrero ahora",
porque depende de que cada movimiento real se registre — algo que, según el
análisis de riesgo del PRD, no ocurre de forma confiable en pastoreo extensivo
(el ganado se mueve solo entre potreros sin que nadie lo documente cada vez).

---

## 5. Diagrama de proceso — Alerta de peso anómalo *(Fase 2 — fuera del MVP)*

> **Movido a Fase 2** tras la revisión de riesgo documentada en el PRD (sección
> 3): lanzar esta alerta sin umbrales zootécnicos validados generaría ruido o
> falsos positivos desde el día uno. Se conserva aquí como **diseño de
> referencia** para cuando se calibre con datos reales del piloto, no como
> trabajo a construir en el MVP. En el MVP, el registro de `HistorialPeso`
> ocurre igual (Flujo, ver Animal en sección 2), simplemente sin el paso de
> comparación contra rango esperado ni la generación de Alerta.

```
Trabajador o Mayordomo registra HistorialPeso de un Animal
        │
        ▼
Sistema compara el nuevo peso contra:
  - el peso anterior registrado (¿hubo caída brusca?)
  - la ganancia diaria esperada para su raza/categoría/edad
        │
        ▼
¿El peso está dentro de rango esperado?
        │
        ├──► Sí → se guarda normalmente, sin alerta
        │
        └──► No (caída brusca o estancamiento prolongado)
                    │
                    ▼
        Sistema crea Alerta:
          tipo = "peso_anomalo"
          animal = referencia al Animal
          mensaje = generado con el detalle (ej. "Pérdida de 8kg en 15 días")
        │
        ▼
        Notificación in-app a Dueño y Mayordomo + WhatsApp/SMS al Dueño
        (según flujo 4.4 del documento de UI/UX)
```

> **Pendiente de definir antes de implementar en Fase 2:** los umbrales exactos
> de "caída brusca" y "ganancia diaria esperada" por raza/categoría — esto
> requiere información zootécnica real, idealmente validada con el mayordomo o
> un veterinario, no un número inventado en el código.

---

## 6. Diagrama de proceso — Sincronización offline con resolución de conflictos

```
App móvil (sin señal) acumula acciones en cola local:
  [crear Peso, crear Mortalidad, crear Movimiento, ...]
  cada acción con: timestamp local + ID de usuario + versión del registro
  base (si aplica, ej. al editar)
        │
        ▼
Dispositivo recupera señal
        │
        ▼
App envía cola al backend, una acción a la vez, en orden cronológico local
        │
        ▼
Backend evalúa cada acción:
        │
        ├──► Es una CREACIÓN nueva (ej. nuevo registro de Peso)
        │     → no hay conflicto posible, se inserta directamente
        │
        └──► Es una EDICIÓN de un registro existente
                    │
                    ▼
        ¿La versión base que el dispositivo tenía coincide con la versión
        actual en el servidor?
                    │
                    ├──► Sí coincide → se aplica el cambio sin problema
                    │
                    └──► No coincide (alguien más editó mientras tanto)
                                │
                                ▼
                    Backend NO sobrescribe. Devuelve ambas versiones al
                    dispositivo (la enviada vs. la actual del servidor)
                                │
                                ▼
                    App muestra pantalla de resolución de conflicto al
                    usuario (ver UI/UX 4.3) → usuario decide
                                │
                                ▼
                    Se envía la versión resuelta como una nueva edición
```

---

## 7. Hallazgos de este documento que impactan el modelo de datos (TRD)

Resumen de decisiones de flujo que **no estaban en el diagrama de clases
original** y deben incorporarse en el TRD:

1. **Venta y Gasto** necesitan un campo de estado (`pendiente_aprobacion`,
   `aprobado`, `rechazado`), un campo `nivel_escalamiento` (1, 2 o 3), un
   booleano `auto_aprobado`, y referencias a quién lo creó vs. quién lo aprobó
   (puede ser el Dueño o el Delegado, según el nivel).
2. **Becerro** necesita relación directa a la `Reproduccion` que lo originó
   (no solo herencia de `Animal`), resolviendo el hueco de genealogía.
3. **MovimientoGanado** necesita dos relaciones nombradas (`potreroOrigen`,
   `potreroDestino`), no dos asociaciones idénticas sin rol.
4. Nueva entidad **Gasto/CostoOperativo**, categorizada, con su propio flujo de
   aprobación análogo al de Venta (incluyendo el mismo escalamiento de 3 niveles).
5. Los registros sincronizados desde móvil necesitan un campo de control de
   versión (ej. `version` o `lastModifiedAt`) para detectar conflictos de
   edición concurrente.
6. Se confirma la corrección de la inconsistencia Animal-Toro/Vaca señalada en
   el análisis previo del diagrama de clases: la relación correcta es **solo
   herencia** (Generalization), eliminando la asociación duplicada que no tenía
   propósito claro.
7. Nueva entidad/configuración **Delegado**: referencia a un Usuario (o un
   contacto externo) configurado por el Dueño, usado únicamente en el Nivel 2
   del escalamiento de aprobaciones. No requiere ser un rol completo del
   sistema — basta con un campo de configuración en el perfil del Dueño que
   apunte a un Usuario con permisos limitados (ver matriz de UI/UX, sección 3).
8. Los plazos de cada nivel de escalamiento (cuántos días sin respuesta antes
   de avanzar de nivel) deben ser **configurables por finca**, no constantes
   fijas en el código — distintos dueños pueden preferir plazos distintos.
