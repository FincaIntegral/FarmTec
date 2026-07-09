package com.ganadosmart.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ganadosmart.app.data.Session
import com.ganadosmart.app.theme.AppColors
import com.ganadosmart.app.theme.AppIcons

// Destinos — el sidebar web se convierte en bottom nav + sección "Más".
enum class Destino(val etiqueta: String, val icono: ImageVector) {
    Dashboard("Dashboard", AppIcons.Dashboard),
    Animales("Animales", AppIcons.Tag),
    Reproduccion("Reproducción", AppIcons.Heart),
    Potreros("Potreros", AppIcons.MapPin),
    Mas("Más", AppIcons.More),
}

// Subpantallas dentro de "Más" (tareas de escritorio del dueño/admin)
enum class SubDestino(val etiqueta: String, val icono: ImageVector) {
    Ventas("Ventas", AppIcons.Cart),
    Gastos("Gastos", AppIcons.Receipt),
    Mortalidad("Mortalidad", AppIcons.Skull),
    Usuarios("Usuarios", AppIcons.Users),
    Alertas("Alertas", AppIcons.Bell),
}

private fun tabsVisibles(): List<Destino> = buildList {
    if (Session.esFinanciero) add(Destino.Dashboard)
    add(Destino.Animales)
    add(Destino.Reproduccion)
    add(Destino.Potreros)
    add(Destino.Mas)
}

private fun subDestinosVisibles(): List<SubDestino> = buildList {
    if (Session.esFinanciero) {
        add(SubDestino.Ventas)
        add(SubDestino.Gastos)
    }
    add(SubDestino.Mortalidad)
    if (Session.esDueno) add(SubDestino.Usuarios)
    if (Session.esFinanciero) add(SubDestino.Alertas)
}

@Composable
fun Shell(onLogout: () -> Unit) {
    val tabs = remember { tabsVisibles() }
    var tab by remember { mutableStateOf(tabs.first()) }
    var subPantalla by remember { mutableStateOf<SubDestino?>(null) }

    Column(modifier = Modifier.fillMaxSize().background(AppColors.background)) {
        // ── Contenido ──
        Box(modifier = Modifier.weight(1f).statusBarsPadding()) {
            val sub = subPantalla
            if (tab == Destino.Mas && sub != null) {
                when (sub) {
                    SubDestino.Ventas -> VentasScreen(onVolver = { subPantalla = null })
                    SubDestino.Gastos -> GastosScreen(onVolver = { subPantalla = null })
                    SubDestino.Mortalidad -> MortalidadScreen(onVolver = { subPantalla = null })
                    SubDestino.Usuarios -> UsuariosScreen(onVolver = { subPantalla = null })
                    SubDestino.Alertas -> AlertasScreen(onVolver = { subPantalla = null })
                }
            } else {
                when (tab) {
                    Destino.Dashboard -> DashboardScreen()
                    Destino.Animales -> AnimalesScreen()
                    Destino.Reproduccion -> ReproduccionScreen()
                    Destino.Potreros -> PotrerosScreen()
                    Destino.Mas -> MasScreen(
                        destinos = subDestinosVisibles(),
                        onAbrir = { subPantalla = it },
                        onLogout = onLogout,
                    )
                }
            }
        }

        // ── Bottom nav ──
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(AppColors.card)
                .windowInsetsPadding(WindowInsets.navigationBars)
                .padding(vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
        ) {
            tabs.forEach { destino ->
                val activo = tab == destino
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier
                        .clickable {
                            tab = destino
                            subPantalla = null
                        }
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                ) {
                    Icon(
                        destino.icono,
                        contentDescription = destino.etiqueta,
                        tint = if (activo) AppColors.amber500 else AppColors.mutedForeground,
                        modifier = Modifier.size(22.dp),
                    )
                    Text(
                        destino.etiqueta,
                        fontSize = 9.sp,
                        color = if (activo) AppColors.amber500 else AppColors.mutedForeground,
                    )
                }
            }
        }
    }
}

// Encabezado de pantalla — título + subtítulo, como los h1 de la web.
@Composable
fun Encabezado(titulo: String, subtitulo: String? = null, onVolver: (() -> Unit)? = null) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
    ) {
        if (onVolver != null) {
            Icon(
                AppIcons.Back,
                contentDescription = "Volver",
                tint = AppColors.mutedForeground,
                modifier = Modifier
                    .size(26.dp)
                    .clickable { onVolver() }
                    .padding(end = 4.dp),
            )
        }
        Column {
            Text(titulo, style = MaterialTheme.typography.headlineSmall, color = AppColors.foreground)
            subtitulo?.let {
                Text(it, style = MaterialTheme.typography.bodySmall, color = AppColors.mutedForeground)
            }
        }
    }
}

@Composable
private fun MasScreen(
    destinos: List<SubDestino>,
    onAbrir: (SubDestino) -> Unit,
    onLogout: () -> Unit,
) {
    val usuario = Session.usuario

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Encabezado("Más", "Módulos y sesión")

        // Perfil
        AppCard {
            Row(verticalAlignment = Alignment.CenterVertically) {
                AvatarIniciales(usuario?.nombre ?: "", size = 40)
                Column(modifier = Modifier.padding(start = 10.dp)) {
                    Text(
                        usuario?.nombre ?: "",
                        style = MaterialTheme.typography.titleMedium,
                        color = AppColors.foreground,
                    )
                    Badge(rolLabel(Session.rol), rolVariant(Session.rol))
                }
            }
        }

        // Sincronización offline
        SyncCard()

        destinos.forEach { d ->
            AppCard(modifier = Modifier.clickable { onAbrir(d) }) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        d.icono,
                        contentDescription = d.etiqueta,
                        tint = AppColors.amber500,
                        modifier = Modifier.size(20.dp),
                    )
                    Text(
                        d.etiqueta,
                        style = MaterialTheme.typography.titleMedium,
                        color = AppColors.foreground,
                        modifier = Modifier.padding(start = 12.dp),
                    )
                }
            }
        }

        AppCard(modifier = Modifier.clickable { onLogout() }) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    AppIcons.Logout,
                    contentDescription = "Salir",
                    tint = AppColors.red400,
                    modifier = Modifier.size(20.dp),
                )
                Text(
                    "Cerrar sesión",
                    style = MaterialTheme.typography.titleMedium,
                    color = AppColors.red400,
                    modifier = Modifier.padding(start = 12.dp),
                )
            }
        }
    }
}
