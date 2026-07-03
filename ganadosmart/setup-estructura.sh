#!/bin/bash
# Script de creación de estructura — GanadoSmart (monorepo)
# ORDEN DE EJECUCIÓN OBLIGATORIO (ver README §0 más abajo):
#   1. Inicializar los 3 proyectos con su CLI oficial DENTRO de ganadosmart/
#      (nest new backend / ng new web / npx react-native init mobile)
#   2. Correr ESTE script desde la raíz que contiene a ganadosmart/
#      (el script entra a cada carpeta y AJUSTA lo que el CLI generó)
#
# Backend/Mobile/Shared-contracts: doc 09_Ramificacion_Carpetas.md
# Web: doc 10_Ramificacion_Frontend_Web.md (derivada del mockup)

set -e  # detiene el script si algún comando falla, en vez de seguir a medias

ROOT="ganadosmart"

if [ ! -d "$ROOT" ]; then
  echo "ERROR: no existe la carpeta ./$ROOT — corre primero los 3 CLI (nest new, ng new, react-native init) dentro de una carpeta ganadosmart/ existente."
  exit 1
fi

echo "Ajustando estructura en ./$ROOT (asumiendo que los 3 CLI ya corrieron) ..."

# ───────────────────────── RAÍZ ─────────────────────────
touch "$ROOT/docker-compose.yml" "$ROOT/.env.example" "$ROOT/README.md"
# .gitignore: si ya existe (lo crea ng new / nest new), NO se sobrescribe
[ -f "$ROOT/.gitignore" ] || touch "$ROOT/.gitignore"

# ───────────────────────── BACKEND ─────────────────────────
# Asume que ya corriste: cd ganadosmart && nest new backend --skip-git --package-manager npm
BACK="$ROOT/backend/src"

if [ ! -d "$BACK" ]; then
  echo "ERROR: no existe $BACK — corre 'nest new backend' dentro de ./$ROOT antes de continuar."
  exit 1
fi

# Limpiar scaffold por defecto de NestJS (app.controller.ts/spec, app.service.ts)
# app.module.ts y main.ts SÍ se conservan, los vamos a editar, no recrear
rm -f "$BACK/app.controller.ts" "$BACK/app.controller.spec.ts" "$BACK/app.service.ts"

mkdir -p "$BACK/modules/usuario/entities" "$BACK/modules/usuario/dto" "$BACK/modules/usuario/guards"
touch "$BACK/modules/usuario/usuario.controller.ts" \
      "$BACK/modules/usuario/usuario.service.ts" \
      "$BACK/modules/usuario/usuario.repository.ts" \
      "$BACK/modules/usuario/entities/usuario.entity.ts" \
      "$BACK/modules/usuario/dto/create-usuario.dto.ts" \
      "$BACK/modules/usuario/dto/usuario-response.dto.ts" \
      "$BACK/modules/usuario/dto/login.dto.ts" \
      "$BACK/modules/usuario/guards/jwt-auth.guard.ts" \
      "$BACK/modules/usuario/guards/roles.guard.ts" \
      "$BACK/modules/usuario/guards/finca-tenant.guard.ts" \
      "$BACK/modules/usuario/usuario.module.ts"

mkdir -p "$BACK/modules/animal/entities" "$BACK/modules/animal/dto"
touch "$BACK/modules/animal/animal.controller.ts" \
      "$BACK/modules/animal/animal.service.ts" \
      "$BACK/modules/animal/animal.repository.ts" \
      "$BACK/modules/animal/entities/animal.entity.ts" \
      "$BACK/modules/animal/dto/create-animal.dto.ts" \
      "$BACK/modules/animal/dto/animal-response.dto.ts" \
      "$BACK/modules/animal/dto/animal-list-item.dto.ts" \
      "$BACK/modules/animal/animal.module.ts"

mkdir -p "$BACK/modules/reproduccion/entities" "$BACK/modules/reproduccion/dto"
touch "$BACK/modules/reproduccion/reproduccion.controller.ts" \
      "$BACK/modules/reproduccion/reproduccion.service.ts" \
      "$BACK/modules/reproduccion/reproduccion.repository.ts" \
      "$BACK/modules/reproduccion/entities/reproduccion.entity.ts" \
      "$BACK/modules/reproduccion/dto/create-reproduccion.dto.ts" \
      "$BACK/modules/reproduccion/dto/reproduccion-response.dto.ts" \
      "$BACK/modules/reproduccion/reproduccion.module.ts"

mkdir -p "$BACK/modules/potrero/entities" "$BACK/modules/potrero/dto"
touch "$BACK/modules/potrero/potrero.controller.ts" \
      "$BACK/modules/potrero/potrero.service.ts" \
      "$BACK/modules/potrero/potrero.repository.ts" \
      "$BACK/modules/potrero/entities/potrero.entity.ts" \
      "$BACK/modules/potrero/entities/movimiento-ganado.entity.ts" \
      "$BACK/modules/potrero/dto/create-movimiento.dto.ts" \
      "$BACK/modules/potrero/dto/potrero-response.dto.ts" \
      "$BACK/modules/potrero/potrero.module.ts"

mkdir -p "$BACK/modules/venta/entities" "$BACK/modules/venta/dto"
touch "$BACK/modules/venta/venta.controller.ts" \
      "$BACK/modules/venta/venta.service.ts" \
      "$BACK/modules/venta/venta.repository.ts" \
      "$BACK/modules/venta/entities/venta.entity.ts" \
      "$BACK/modules/venta/dto/create-venta.dto.ts" \
      "$BACK/modules/venta/dto/venta-response.dto.ts" \
      "$BACK/modules/venta/dto/aprobar-rechazar.dto.ts" \
      "$BACK/modules/venta/venta.module.ts"

mkdir -p "$BACK/modules/gasto/entities" "$BACK/modules/gasto/dto"
touch "$BACK/modules/gasto/gasto.controller.ts" \
      "$BACK/modules/gasto/gasto.service.ts" \
      "$BACK/modules/gasto/gasto.repository.ts" \
      "$BACK/modules/gasto/entities/gasto.entity.ts" \
      "$BACK/modules/gasto/dto/create-gasto.dto.ts" \
      "$BACK/modules/gasto/dto/gasto-response.dto.ts" \
      "$BACK/modules/gasto/gasto.module.ts"

mkdir -p "$BACK/modules/reporte/dto"
touch "$BACK/modules/reporte/reporte.controller.ts" \
      "$BACK/modules/reporte/reporte.service.ts" \
      "$BACK/modules/reporte/dto/dashboard-response.dto.ts" \
      "$BACK/modules/reporte/dto/ingresos-vs-gastos.dto.ts" \
      "$BACK/modules/reporte/reporte.module.ts"

mkdir -p "$BACK/modules/alerta/entities" "$BACK/modules/alerta/dto"
touch "$BACK/modules/alerta/alerta.controller.ts" \
      "$BACK/modules/alerta/alerta.service.ts" \
      "$BACK/modules/alerta/alerta.repository.ts" \
      "$BACK/modules/alerta/entities/alerta.entity.ts" \
      "$BACK/modules/alerta/dto/alerta-response.dto.ts" \
      "$BACK/modules/alerta/alerta.module.ts"

mkdir -p "$BACK/modules/notificacion/ports" "$BACK/modules/notificacion/adapters"
touch "$BACK/modules/notificacion/notificacion.service.ts" \
      "$BACK/modules/notificacion/ports/notification-sender.port.ts" \
      "$BACK/modules/notificacion/adapters/twilio.adapter.ts" \
      "$BACK/modules/notificacion/adapters/whatsapp-bsp.adapter.ts" \
      "$BACK/modules/notificacion/notificacion.module.ts"

mkdir -p "$BACK/shared/decorators" "$BACK/shared/filters" "$BACK/migrations"
touch "$BACK/shared/decorators/current-user.decorator.ts" \
      "$BACK/shared/filters/http-exception.filter.ts"
touch "$BACK/migrations/.gitkeep"
# app.module.ts y main.ts: NO se tocan si ya existen (los crea nest new),
# solo se crean si por algún motivo no existieran
[ -f "$BACK/app.module.ts" ] || touch "$BACK/app.module.ts"
[ -f "$BACK/main.ts" ] || touch "$BACK/main.ts"

echo "  ✓ backend/ ajustado (scaffold por defecto de NestJS limpiado)"

# ───────────────────────── WEB (Angular) ─────────────────────────
# Asume que ya corriste: cd ganadosmart && ng new web --routing --style=css --skip-git
WEB="$ROOT/web/src/app"

if [ ! -d "$WEB" ]; then
  echo "ERROR: no existe $WEB — corre 'ng new web' dentro de ./$ROOT antes de continuar."
  exit 1
fi

# Limpiar scaffold por defecto de Angular (app.component.* de ejemplo)
# Se conservan app.routes.ts y app.config.ts que ng new ya genera y que sí usamos
rm -f "$WEB/app.component.ts" "$WEB/app.component.html" "$WEB/app.component.css" \
      "$WEB/app.component.spec.ts" "$WEB/app.component.spec.ts"

mkdir -p "$WEB/core/auth" "$WEB/core/guards" "$WEB/core/api"
touch "$WEB/core/auth/auth.service.ts" \
      "$WEB/core/auth/auth.interceptor.ts" \
      "$WEB/core/guards/role.guard.ts" \
      "$WEB/core/api/api-client.service.ts"

mkdir -p "$WEB/shared/components/kpi-card" \
         "$WEB/shared/components/badge" \
         "$WEB/shared/components/section-header" \
         "$WEB/shared/components/card" \
         "$WEB/shared/components/dot" \
         "$WEB/shared/components/sidebar" \
         "$WEB/shared/components/topbar" \
         "$WEB/shared/pipes" \
         "$WEB/shared/chart-tooltip"

touch "$WEB/shared/components/kpi-card/kpi-card.component.ts" \
      "$WEB/shared/components/kpi-card/kpi-card.component.html" \
      "$WEB/shared/components/badge/badge.component.ts" \
      "$WEB/shared/components/badge/badge.component.html" \
      "$WEB/shared/components/section-header/section-header.component.ts" \
      "$WEB/shared/components/section-header/section-header.component.html" \
      "$WEB/shared/components/card/card.component.ts" \
      "$WEB/shared/components/card/card.component.html" \
      "$WEB/shared/components/dot/dot.component.ts" \
      "$WEB/shared/components/dot/dot.component.html" \
      "$WEB/shared/components/sidebar/sidebar.component.ts" \
      "$WEB/shared/components/sidebar/sidebar.component.html" \
      "$WEB/shared/components/sidebar/nav-items.ts" \
      "$WEB/shared/components/topbar/topbar.component.ts" \
      "$WEB/shared/components/topbar/topbar.component.html" \
      "$WEB/shared/chart-tooltip/chart-tooltip.component.ts" \
      "$WEB/shared/chart-tooltip/chart-tooltip.component.html"

mkdir -p "$WEB/features/auth/login"
touch "$WEB/features/auth/login/login.component.ts" \
      "$WEB/features/auth/login/login.component.html"

mkdir -p "$WEB/features/dashboard/widgets/herd-evolution-chart" \
         "$WEB/features/dashboard/widgets/financial-chart" \
         "$WEB/features/dashboard/widgets/age-distribution-chart" \
         "$WEB/features/dashboard/widgets/pending-approvals-widget"
touch "$WEB/features/dashboard/dashboard.component.ts" \
      "$WEB/features/dashboard/dashboard.component.html" \
      "$WEB/features/dashboard/widgets/herd-evolution-chart/herd-evolution-chart.component.ts" \
      "$WEB/features/dashboard/widgets/herd-evolution-chart/herd-evolution-chart.component.html" \
      "$WEB/features/dashboard/widgets/financial-chart/financial-chart.component.ts" \
      "$WEB/features/dashboard/widgets/financial-chart/financial-chart.component.html" \
      "$WEB/features/dashboard/widgets/age-distribution-chart/age-distribution-chart.component.ts" \
      "$WEB/features/dashboard/widgets/age-distribution-chart/age-distribution-chart.component.html" \
      "$WEB/features/dashboard/widgets/pending-approvals-widget/pending-approvals-widget.component.ts" \
      "$WEB/features/dashboard/widgets/pending-approvals-widget/pending-approvals-widget.component.html"

mkdir -p "$WEB/features/animales/listado" \
         "$WEB/features/animales/detalle/widgets/genealogia-card" \
         "$WEB/features/animales/detalle/widgets/peso-history-chart" \
         "$WEB/features/animales/detalle/widgets/timeline-historial"
touch "$WEB/features/animales/listado/listado.component.ts" \
      "$WEB/features/animales/listado/listado.component.html" \
      "$WEB/features/animales/detalle/detalle.component.ts" \
      "$WEB/features/animales/detalle/detalle.component.html" \
      "$WEB/features/animales/detalle/widgets/genealogia-card/genealogia-card.component.ts" \
      "$WEB/features/animales/detalle/widgets/genealogia-card/genealogia-card.component.html" \
      "$WEB/features/animales/detalle/widgets/peso-history-chart/peso-history-chart.component.ts" \
      "$WEB/features/animales/detalle/widgets/peso-history-chart/peso-history-chart.component.html" \
      "$WEB/features/animales/detalle/widgets/timeline-historial/timeline-historial.component.ts" \
      "$WEB/features/animales/detalle/widgets/timeline-historial/timeline-historial.component.html"

mkdir -p "$WEB/features/reproduccion"
touch "$WEB/features/reproduccion/reproduccion.component.ts" \
      "$WEB/features/reproduccion/reproduccion.component.html"

mkdir -p "$WEB/features/potreros/movimiento"
touch "$WEB/features/potreros/movimiento/movimiento.component.ts" \
      "$WEB/features/potreros/movimiento/movimiento.component.html"

mkdir -p "$WEB/features/ventas/registro"
touch "$WEB/features/ventas/registro/registro.component.ts" \
      "$WEB/features/ventas/registro/registro.component.html"

mkdir -p "$WEB/features/gastos/registro"
touch "$WEB/features/gastos/registro/registro.component.ts" \
      "$WEB/features/gastos/registro/registro.component.html"

mkdir -p "$WEB/features/aprobaciones/pendientes" "$WEB/features/aprobaciones/configuracion-delegado"
touch "$WEB/features/aprobaciones/pendientes/pendientes.component.ts" \
      "$WEB/features/aprobaciones/pendientes/pendientes.component.html" \
      "$WEB/features/aprobaciones/configuracion-delegado/configuracion-delegado.component.ts" \
      "$WEB/features/aprobaciones/configuracion-delegado/configuracion-delegado.component.html"

mkdir -p "$WEB/features/reportes/ingresos-vs-gastos"
touch "$WEB/features/reportes/ingresos-vs-gastos/ingresos-vs-gastos.component.ts" \
      "$WEB/features/reportes/ingresos-vs-gastos/ingresos-vs-gastos.component.html"

mkdir -p "$WEB/features/usuarios"
touch "$WEB/features/usuarios/usuarios.component.ts" \
      "$WEB/features/usuarios/usuarios.component.html"

mkdir -p "$ROOT/web/src/styles"
touch "$ROOT/web/src/styles/theme.css"
# app.routes.ts: ng new --routing ya lo genera, NO se sobrescribe
[ -f "$WEB/app.routes.ts" ] || touch "$WEB/app.routes.ts"

echo "  ✓ web/ ajustado (scaffold por defecto de Angular limpiado)"

# Carpeta de referencia Fase 2 (doc 10, sección 5) — fuera del código de producción
mkdir -p "$ROOT/docs/referencias-fase2"
touch "$ROOT/docs/referencias-fase2/.gitkeep"

# ───────────────────────── MOBILE (React Native) ─────────────────────────
# Asume que ya corriste el init de React Native dentro de ./$ROOT/mobile
MOB="$ROOT/mobile/src"

if [ ! -d "$ROOT/mobile" ]; then
  echo "ERROR: no existe $ROOT/mobile — inicializa React Native dentro de ./$ROOT antes de continuar."
  exit 1
fi

# React Native no crea src/ por defecto (usa App.tsx en la raíz) — lo creamos
mkdir -p "$MOB/core/auth" "$MOB/core/api-client" "$MOB/core/sync"
touch "$MOB/core/auth/auth.service.ts" \
      "$MOB/core/api-client/api-client.service.ts" \
      "$MOB/core/sync/local-queue.ts" \
      "$MOB/core/sync/sync-engine.ts" \
      "$MOB/core/sync/conflict-resolver.ts" \
      "$MOB/core/sync/version-tracker.ts"

mkdir -p "$MOB/screens/Login" \
         "$MOB/screens/RegistroRapido" \
         "$MOB/screens/DetalleAnimal" \
         "$MOB/screens/PendientesAprobacion" \
         "$MOB/screens/Dashboard" \
         "$MOB/components"
touch "$MOB/screens/Login/Login.tsx" \
      "$MOB/screens/RegistroRapido/RegistrarPeso.tsx" \
      "$MOB/screens/RegistroRapido/RegistrarMortalidad.tsx" \
      "$MOB/screens/RegistroRapido/RegistrarMovimiento.tsx" \
      "$MOB/screens/DetalleAnimal/DetalleAnimal.tsx" \
      "$MOB/screens/PendientesAprobacion/PendientesAprobacion.tsx" \
      "$MOB/screens/Dashboard/Dashboard.tsx"

echo "  ✓ mobile/src/ creado (React Native no lo genera por defecto)"
echo "  NOTA: App.tsx de React Native queda en la raíz de mobile/, fuera de src/"
echo "        — ahí se importa la navegación que usa screens/ (no se mueve App.tsx)"

# ───────────────────────── SHARED-CONTRACTS ─────────────────────────
SC="$ROOT/shared-contracts"
mkdir -p "$SC/dto" "$SC/enums"
touch "$SC/dto/usuario.dto.ts" \
      "$SC/dto/animal.dto.ts" \
      "$SC/dto/reproduccion.dto.ts" \
      "$SC/dto/potrero.dto.ts" \
      "$SC/dto/venta.dto.ts" \
      "$SC/dto/gasto.dto.ts" \
      "$SC/dto/reporte.dto.ts" \
      "$SC/dto/alerta.dto.ts" \
      "$SC/enums/estado-aprobacion.enum.ts" \
      "$SC/enums/rol.enum.ts" \
      "$SC/enums/nivel-escalamiento.enum.ts" \
      "$SC/enums/categoria-gasto.enum.ts" \
      "$SC/enums/tipo-origen-alerta.enum.ts"

echo ""
echo "Listo. Estructura ajustada en ./$ROOT"
echo "Próximo paso: revisar git status dentro de cada subproyecto para confirmar"
echo "que la limpieza del scaffold por defecto no borró nada que sí necesitabas."
