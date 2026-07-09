package com.ganadosmart.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ganadosmart.app.data.Alerta
import com.ganadosmart.app.data.Api
import com.ganadosmart.app.theme.AppColors
import kotlinx.coroutines.launch

private fun severidadVariant(s: String): BadgeVariant = when (s) {
    "critica" -> BadgeVariant.Red
    "alta" -> BadgeVariant.Orange
    "media" -> BadgeVariant.Yellow
    else -> BadgeVariant.Sky
}

@Composable
fun AlertasScreen(onVolver: () -> Unit) {
    var alertas by remember { mutableStateOf<List<Alerta>>(emptyList()) }
    var filtro by remember { mutableStateOf("no_leidas") }
    var pagina by remember { mutableIntStateOf(1) }
    var totalPaginas by remember { mutableIntStateOf(1) }
    var cargando by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var recarga by remember { mutableIntStateOf(0) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(filtro, pagina, recarga) {
        cargando = true
        error = null
        try {
            val resp = Api.alertas(
                leida = when (filtro) {
                    "no_leidas" -> false
                    "leidas" -> true
                    else -> null
                },
                pagina = pagina,
                limite = 20,
            )
            alertas = if (pagina == 1) resp.datos else alertas + resp.datos
            totalPaginas = resp.meta.totalPaginas
        } catch (e: Exception) {
            error = e.message
        }
        cargando = false
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Encabezado("Alertas", "Notificaciones de la finca", onVolver = onVolver)

        FilterChips(
            opciones = listOf(
                "no_leidas" to "No leídas",
                "leidas" to "Leídas",
                "todas" to "Todas",
            ),
            seleccionado = filtro,
            onSeleccion = { filtro = it; pagina = 1 },
        )
        Spacer(Modifier.height(10.dp))
        error?.let { MensajeError(it) }

        if (cargando && alertas.isEmpty()) {
            Cargando()
        } else if (alertas.isEmpty()) {
            EstadoVacio("No hay alertas.")
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(alertas, key = { it.id }) { a ->
                    AppCard {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Badge(a.severidad, severidadVariant(a.severidad))
                            Text(
                                a.fecha.take(10),
                                style = MaterialTheme.typography.bodySmall,
                                color = AppColors.mutedForeground,
                            )
                        }
                        Spacer(Modifier.height(6.dp))
                        Text(
                            a.mensaje,
                            style = MaterialTheme.typography.bodyMedium,
                            color = if (a.leida) AppColors.mutedForeground else AppColors.foreground,
                        )
                        if (!a.leida) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.End,
                            ) {
                                TextButton(onClick = {
                                    scope.launch {
                                        try {
                                            Api.marcarLeida(a.id)
                                            pagina = 1; recarga++
                                        } catch (e: Exception) {
                                            error = e.message
                                        }
                                    }
                                }) {
                                    Text(
                                        "Marcar leída",
                                        color = AppColors.amber400,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                    )
                                }
                            }
                        }
                    }
                }
                item {
                    CargarMas(pagina < totalPaginas, cargando) { pagina++ }
                    Spacer(Modifier.height(20.dp))
                }
            }
        }
    }
}
