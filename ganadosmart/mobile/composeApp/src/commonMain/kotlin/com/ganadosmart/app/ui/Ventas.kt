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
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ganadosmart.app.data.Api
import com.ganadosmart.app.data.CrearVentaRequest
import com.ganadosmart.app.data.Session
import com.ganadosmart.app.data.SyncStore
import com.ganadosmart.app.data.Venta
import com.ganadosmart.app.hoyIso
import com.ganadosmart.app.theme.AppColors
import com.ganadosmart.app.theme.AppIcons
import kotlinx.coroutines.launch

@Composable
fun VentasScreen(onVolver: () -> Unit) {
    var ventas by remember { mutableStateOf<List<Venta>>(emptyList()) }
    var filtro by remember { mutableStateOf("todos") }
    var pagina by remember { mutableIntStateOf(1) }
    var totalPaginas by remember { mutableIntStateOf(1) }
    var total by remember { mutableIntStateOf(0) }
    var cargando by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var recarga by remember { mutableIntStateOf(0) }
    var mostrarCrear by remember { mutableStateOf(false) }
    var rechazando by remember { mutableStateOf<Venta?>(null) }
    val scope = rememberCoroutineScope()

    val codigos = remember { SyncStore.animalesCache.associate { it.id to it.codigo } }

    LaunchedEffect(filtro, pagina, recarga) {
        cargando = true
        error = null
        try {
            val resp = Api.ventas(
                estadoAprobacion = filtro.takeIf { it != "todos" },
                pagina = pagina,
                limite = 20,
            )
            ventas = if (pagina == 1) resp.datos else ventas + resp.datos
            totalPaginas = resp.meta.totalPaginas
            total = resp.meta.totalRegistros
        } catch (e: Exception) {
            error = e.message
        }
        cargando = false
    }

    Scaffold(
        containerColor = AppColors.background,
        floatingActionButton = {
            FloatingActionButton(
                onClick = { mostrarCrear = true },
                containerColor = AppColors.amber600,
                contentColor = Color.White,
            ) { Icon(AppIcons.Plus, contentDescription = "Nueva venta") }
        },
    ) { _ ->
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Encabezado("Ventas", "$total ventas registradas", onVolver = onVolver)

            FilterChips(
                opciones = listOf(
                    "todos" to "Todos",
                    "pendiente" to "Pendientes",
                    "aprobado" to "Aprobadas",
                    "rechazado" to "Rechazadas",
                ),
                seleccionado = filtro,
                onSeleccion = { filtro = it; pagina = 1 },
            )
            Spacer(Modifier.height(10.dp))
            error?.let { MensajeError(it) }

            if (cargando && ventas.isEmpty()) {
                Cargando()
            } else if (ventas.isEmpty()) {
                EstadoVacio("No hay ventas que coincidan.")
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(ventas, key = { it.id }) { v ->
                        AppCard {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Column {
                                    Text(
                                        v.comprador,
                                        style = MaterialTheme.typography.titleMedium,
                                        color = AppColors.foreground,
                                    )
                                    Text(
                                        v.fecha + (v.animalId?.let { " · ${codigos[it] ?: "animal"}" } ?: ""),
                                        style = MaterialTheme.typography.bodySmall,
                                        color = AppColors.mutedForeground,
                                    )
                                }
                                Column(horizontalAlignment = androidx.compose.ui.Alignment.End) {
                                    Text(
                                        moneda(v.monto),
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Black,
                                        color = AppColors.foreground,
                                    )
                                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Badge(
                                            estadoAprobacionLabel(v.estadoAprobacion),
                                            estadoAprobacionVariant(v.estadoAprobacion),
                                        )
                                        if (v.autoAprobado) Badge("Auto", BadgeVariant.Sky)
                                    }
                                }
                            }
                            if (v.estadoAprobacion == "pendiente" && Session.esDueno) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End,
                                ) {
                                    TextButton(onClick = {
                                        scope.launch {
                                            try {
                                                Api.aprobarVenta(v.id)
                                                pagina = 1; recarga++
                                            } catch (e: Exception) {
                                                error = e.message
                                            }
                                        }
                                    }) {
                                        Text("Aprobar", color = AppColors.emerald400, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                    }
                                    TextButton(onClick = { rechazando = v }) {
                                        Text("Rechazar", color = AppColors.red400, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                    }
                                }
                            }
                        }
                    }
                    item {
                        CargarMas(pagina < totalPaginas, cargando) { pagina++ }
                        Spacer(Modifier.height(70.dp))
                    }
                }
            }
        }
    }

    if (mostrarCrear) {
        CrearVentaModal(
            onCerrar = { mostrarCrear = false },
            onCreado = { mostrarCrear = false; pagina = 1; recarga++ },
        )
    }
    rechazando?.let { venta ->
        MotivoRechazoModal(
            titulo = "Rechazar venta — ${venta.comprador}",
            onCerrar = { rechazando = null },
            onRechazar = { motivo, alError ->
                scope.launch {
                    try {
                        Api.rechazarVenta(venta.id, motivo)
                        rechazando = null
                        pagina = 1; recarga++
                    } catch (e: Exception) {
                        alError(e.message ?: "No se pudo rechazar")
                    }
                }
            },
        )
    }
}

@Composable
private fun CrearVentaModal(onCerrar: () -> Unit, onCreado: () -> Unit) {
    val vendibles = SyncStore.animalesCache.filter { it.estado == "activo" || it.estado == "en_tratamiento" }
    var animalId by remember { mutableStateOf("") }
    var comprador by remember { mutableStateOf("") }
    var monto by remember { mutableStateOf("") }
    var fecha by remember { mutableStateOf(hoyIso()) }
    var error by remember { mutableStateOf<String?>(null) }
    var guardando by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Modal("Nueva venta", onCerrar) {
        Selector(
            "Animal (opcional)",
            listOf("" to "Sin animal asociado") + vendibles.map { it.id to it.codigo },
            animalId,
            { animalId = it },
        )
        CampoTexto(comprador, { comprador = it }, "Comprador *")
        CampoTexto(monto, { monto = it }, "Monto *")
        CampoTexto(fecha, { fecha = it }, "Fecha (YYYY-MM-DD) *")
        error?.let { MensajeError(it) }
        BotonPrimario(
            texto = if (guardando) "Guardando…" else "Registrar venta",
            habilitado = !guardando && comprador.isNotBlank() && (monto.toDoubleOrNull() ?: 0.0) > 0,
            onClick = {
                guardando = true
                error = null
                scope.launch {
                    try {
                        Api.crearVenta(
                            CrearVentaRequest(
                                comprador = comprador.trim(),
                                monto = monto.toDouble(),
                                fecha = fecha,
                                animalId = animalId.ifBlank { null },
                            ),
                        )
                        onCreado()
                    } catch (e: Exception) {
                        error = e.message ?: "No se pudo registrar"
                    } finally {
                        guardando = false
                    }
                }
            },
        )
    }
}

// Compartido con Gastos
@Composable
fun MotivoRechazoModal(
    titulo: String,
    onCerrar: () -> Unit,
    onRechazar: (String?, (String) -> Unit) -> Unit,
) {
    var motivo by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    Modal(titulo, onCerrar) {
        CampoTexto(motivo, { motivo = it }, "Motivo (opcional)")
        error?.let { MensajeError(it) }
        BotonPrimario(
            "Rechazar",
            color = AppColors.red500,
            onClick = { onRechazar(motivo.trim().ifBlank { null }) { error = it } },
        )
    }
}
