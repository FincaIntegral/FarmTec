# GanadoSmart — Contexto para Claude Code

## Proyecto
SaaS de gestión ganadera para finca piloto en los Llanos Orientales, Colombia.
Equipo: Diego (PM + Backend) y Juan (Frontend + Módulos financieros).
Stack: NestJS + Angular + React Native + PostgreSQL (Supabase).

## Reglas de trabajo con Claude Code

### SIEMPRE antes de implementar
1. Leer `doc/contrato-api-v2.yaml` antes de crear cualquier endpoint
2. Leer `doc/schema.sql` antes de crear cualquier entidad
3. Leer `doc/historial-auditor.md` para saber qué ya se hizo y qué problemas hubo
4. Proponer el plan completo y esperar confirmación — nunca implementar sin aprobación
5. Si hay ambigüedad entre el contrato y el schema, preguntar antes de asumir
6. Al terminar cada módulo, actualizar `doc/historial-auditor.md`

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
