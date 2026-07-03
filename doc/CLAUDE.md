# GanadoSmart — Contexto para Claude Code

## Proyecto
SaaS de gestión ganadera para finca piloto en los Llanos Orientales, Colombia.
Equipo: Diego (PM + Backend) y Juan (Frontend + Módulos financieros).
Stack: NestJS + Angular + React Native + PostgreSQL (Supabase).

## Reglas de trabajo con Claude Code

### SIEMPRE antes de implementar
1. Leer el contrato de API (`docs/contrato-api-v2.yaml`) antes de crear cualquier endpoint
2. Leer el schema de base de datos (`docs/schema.sql`) antes de crear cualquier entidad
3. Proponer el plan completo y esperar confirmación — nunca implementar sin aprobación previa
4. Si hay ambigüedad entre el contrato y el schema, preguntar antes de asumir

### NUNCA hacer sin permiso explícito
- Cambiar nombres de columnas, tablas o enums del schema.sql
- Agregar endpoints que no estén en contrato-api-v2.yaml
- Cambiar los 4 roles: dueno_finca, administrador_finca, veterinario, usuario_consulta
- Tocar los archivos: product-requirements.md, architecture.md, database-schema.md, CLAUDE.md
- Hacer push directo a main o develop — siempre feature/* primero

### Convenciones de código
- Nombres de variables y funciones: camelCase en TypeScript
- Nombres de columnas en BD: snake_case (ya definidos en schema.sql)
- Módulos NestJS: un módulo por entidad (animal, venta, gasto, etc.)
- DTOs: usar class-validator para validación, reflejar exactamente los schemas del contrato
- Guards: jwt-auth.guard + roles.guard en TODOS los endpoints (sin excepción)
- finca_id: NUNCA recibirlo del cliente — siempre extraerlo del JWT

### Arquitectura en capas (no hexagonal)
Controller → Service → Repository → Entity
- Controller: solo recibe, valida y delega
- Service: lógica de negocio (aquí vive la lógica de auto-aprobación)
- Repository: solo queries a la BD
- Entity: refleja exactamente las tablas del schema.sql

## Contexto crítico de negocio

### Auto-aprobación configurable (no hardcodear)
La lógica de aprobación de Ventas y Gastos lee SIEMPRE de configuracion_aprobacion:
- Si monto < monto_umbral_auto → tipo_aprobacion = 'por_monto', auto_aprobado = true
- Si dias desde created_at > dias_espera_aprobacion → tipo_aprobacion = 'por_tiempo', auto_aprobado = true
- Si el Dueño aprueba manualmente → tipo_aprobacion = 'directa', auto_aprobado = false
- auto_aprobado = true es PERMANENTE — nunca revertirlo

### Genealogía automática en partos
Al confirmar parto exitoso en /reproducciones/{id}/confirmar-parto:
1. Crear ANIMAL becerro con madre_id = vaca_id de la reproduccion
2. Crear ANIMAL becerro con padre_id = toro_id de la reproduccion
3. Llenar becerro_resultante_id en la reproduccion
Todo en una sola transacción — si algo falla, revertir todo.

### finca_id en cada query
Cada query a la BD DEBE incluir WHERE finca_id = {finca_id del JWT}.
Esto es el aislamiento multi-tenant. Si se olvida, un usuario podría
ver datos de otra finca — es una vulnerabilidad crítica.

### codigo en Animal y Finca
El campo `codigo` en animal y finca es el identificador del USUARIO
(caravana/arete para animales, código ICA o propio para fincas).
El `id` UUID es interno — nunca exponerlo al usuario en la UI.


# GanadoSmart — Contexto para Claude Code

## Proyecto
SaaS de gestión ganadera para finca piloto en los Llanos Orientales, Colombia.
Equipo: Diego (PM + Backend) y Juan (Frontend + Módulos financieros).
Stack: NestJS + Angular + React Native + PostgreSQL (Supabase).

## Reglas de trabajo con Claude Code

### SIEMPRE antes de implementar
1. Leer `docs/contrato-api-v2.yaml` antes de crear cualquier endpoint
2. Leer `docs/schema.sql` antes de crear cualquier entidad
3. Leer `docs/historial-auditor.md` para saber qué ya se hizo y qué problemas hubo
4. Proponer el plan completo y esperar confirmación — nunca implementar sin aprobación
5. Si hay ambigüedad entre el contrato y el schema, preguntar antes de asumir
6. Al terminar cada módulo, actualizar `docs/historial-auditor.md`

### NUNCA hacer sin permiso explícito
- Cambiar nombres de columnas, tablas o enums del schema.sql
- Agregar endpoints que no estén en contrato-api-v2.yaml
- Cambiar los 4 roles: dueno_finca, administrador_finca, veterinario, usuario_consulta
- Tocar los archivos: CLAUDE.md, contrato-api-v2.yaml, schema.sql, historial-auditor.md
- Hacer push directo a main o develop — siempre feature/* primero

### Convenciones de código
- Variables y funciones: camelCase en TypeScript
- Columnas en BD: snake_case (definidos en schema.sql — no inventar nombres)
- Un módulo NestJS por entidad (animal, venta, gasto, etc.)
- DTOs: class-validator, reflejan exactamente los schemas del contrato
- Guards: JwtAuthGuard + RolesGuard en TODOS los endpoints sin excepción
- finca_id: NUNCA del cliente — siempre del JWT

### Arquitectura en capas
Controller → Service → Repository → Entity
- Controller: recibe, valida, delega. Sin lógica de negocio.
- Service: lógica de negocio (auto-aprobación, genealogía van aquí)
- Repository: solo queries. Siempre con finca_id en el WHERE.
- Entity: refleja exactamente las tablas del schema.sql

## Contexto crítico de negocio

### Auto-aprobación (leer de configuracion_aprobacion — nunca hardcodear)
- monto < monto_umbral_auto → tipo_aprobacion='por_monto', auto_aprobado=true
- días desde created_at > dias_espera_aprobacion → tipo_aprobacion='por_tiempo', auto_aprobado=true
- Dueño aprueba manualmente → tipo_aprobacion='directa', auto_aprobado=false
- auto_aprobado=true es PERMANENTE — nunca revertirlo

### Genealogía automática en partos
Al confirmar parto exitoso (confirmar-parto):
1. Crear ANIMAL becerro con madre_id=vaca_id y padre_id=toro_id de la reproduccion
2. Llenar becerro_resultante_id en reproduccion
Todo en una sola transacción — si algo falla, revertir todo.

### finca_id en cada query
Cada query DEBE incluir WHERE finca_id={del JWT}.
Sin esto, un usuario ve datos de otra finca. Es vulnerabilidad crítica.

### codigo en Animal y Finca
`codigo` = identificador del usuario (caravana/arete o código ICA).
`id` UUID = interno. Nunca mostrar el UUID al usuario en la UI.