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
import androidx.compose.ui.unit.dp
import com.ganadosmart.app.ahoraIso
import com.ganadosmart.app.data.AccionPendiente
import com.ganadosmart.app.data.Api
import com.ganadosmart.app.data.CrearMovimientoRequest
import com.ganadosmart.app.data.CrearPotreroRequest
import com.ganadosmart.app.data.DatosMovimiento
import com.ganadosmart.app.data.Movimiento
import com.ganadosmart.app.data.Potrero
import com.ganadosmart.app.data.Session
import com.ganadosmart.app.data.SinConexionException
import com.ganadosmart.app.data.SyncStore
import com.ganadosmart.app.hoyIso
import com.ganadosmart.app.theme.AppColors
import com.ganadosmart.app.theme.AppIcons
import kotlinx.coroutines.launch

private fun estadoPotreroLabel(estado: String): String = when (estado) {
    "en_uso" -> "En uso"
    "disponible" -> "Disponible"
    "descanso" -> "Descanso"
    "mantenimiento" -> "Mantenimiento"
    else -> estado
}

private fun estadoPotreroVariant(estado: String): BadgeVariant = when (estado) {
    "en_uso" -> BadgeVariant.Green
    "disponible" -> BadgeVariant.Sky
    "descanso" -> BadgeVariant.Yellow
    else -> BadgeVariant.Gray
}

@Composable
fun PotrerosScreen() {
    var tab by remember { mutableStateOf("potreros") }
    var potreros by remember { mutableStateOf<List<Potrero>>(emptyList()) }
    var movimientos by remember { mutableStateOf<List<Movimiento>>(emptyList()) }
    var pagina by remember { mutableIntStateOf(1) }
    var totalPaginas by remember { mutableIntStateOf(1) }
    var cargando by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var offline by remember { mutableStateOf(false) }
    var recarga by remember { mutableIntStateOf(0) }
    var modal by remember { mutableStateOf<String?>(null) } // potrero | movimiento
    var avisoOffline by remember { mutableStateOf<String?>(null) }

    val codigosAnimal = remember(recarga) { SyncStore.animalesCache.associate { it.id to it.codigo } }
    val nombresPotrero = remember(potreros, recarga) {
        (potreros.ifEmpty { SyncStore.potrerosCache }).associate { it.id to it.nombre }
    }

    LaunchedEffect(recarga) {
        cargando = true
        error = null
        try {
            potreros = Api.potreros()
            SyncStore.potrerosCache = potreros
            offline = false
        } catch (e: SinConexionException) {
            potreros = SyncStore.potrerosCache
            offline = true
        } catch (e: Exception) {
            error = e.message
        }
        cargando = false
    }

    LaunchedEffect(tab, pagina, recarga) {
        if (tab != "movimientos") return@LaunchedEffect
        try {
            val resp = Api.movimientos(pagina = pagina, limite = 20)
            movimientos = if (pagina == 1) resp.datos else movimientos + resp.datos
            totalPaginas = resp.meta.totalPaginas
        } catch (e: Exception) {
            error = e.message
        }
    }

    Scaffold(
        containerColor = AppColors.background,
        floatingActionButton = {
            val puedeCrearPotrero = Session.esFinanciero
            val puedeMover = Session.esCampo
            if ((tab == "potreros" && puedeCrearPotrero) || (tab == "movimientos" && puedeMover)) {
                FloatingActionButton(
                    onClick = { modal = if (tab == "potreros") "potrero" else "movimiento" },
                    containerColor = AppColors.amber600,
                    contentColor = Color.White,
                ) { Icon(AppIcons.Plus, contentDescription = "Nuevo") }
            }
        },
    ) { _ ->
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Encabezado("Potreros", "Potreros y movimientos del ganado")

            FilterChips(
                opciones = listOf("potreros" to "Potreros", "movimientos" to "Movimientos"),
                seleccionado = tab,
                onSeleccion = { tab = it; pagina = 1 },
            )
            Spacer(Modifier.height(10.dp))

            if (offline) {
                Badge("Sin conexión — datos guardados", BadgeVariant.Orange)
                Spacer(Modifier.height(8.dp))
            }
            avisoOffline?.let {
                Badge(it, BadgeVariant.Orange)
                Spacer(Modifier.height(8.dp))
            }
            error?.let { MensajeError(it) }

            if (tab == "potreros") {
                if (cargando && potreros.isEmpty()) {
                    Cargando()
                } else if (potreros.isEmpty()) {
                    EstadoVacio("No hay potreros registrados.")
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(potreros, key = { it.id }) { p ->
                            AppCard {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                ) {
                                    Column {
                                        Text(
                                            p.nombre,
                                            style = MaterialTheme.typography.titleMedium,
                                            color = AppColors.foreground,
                                        )
                                        Text(
                                            listOfNotNull(
                                                p.hectareas?.let { "${numero(it)} ha" },
                                                p.tipoPasto,
                                                p.capacidadEstimada?.let { "cap. $it" },
                                            ).joinToString(" · ").ifBlank { "Sin datos adicionales" },
                                            style = MaterialTheme.typography.bodySmall,
                                            color = AppColors.mutedForeground,
                                        )
                                    }
                                    Badge(estadoPotreroLabel(p.estado), estadoPotreroVariant(p.estado))
                                }
                            }
                        }
                        item { Spacer(Modifier.height(70.dp)) }
                    }
                }
            } else {
                if (movimientos.isEmpty()) {
                    EstadoVacio("No hay movimientos registrados.")
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(movimientos, key = { it.id }) { m ->
                            AppCard {
                                Text(
                                    codigosAnimal[m.animalId] ?: m.animalId.take(8),
                                    style = MaterialTheme.typography.titleMedium,
                                    color = AppColors.foreground,
                                )
                                Text(
                                    "${nombresPotrero[m.potreroOrigenId] ?: "?"} → ${nombresPotrero[m.potreroDestinoId] ?: "?"}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = AppColors.mutedForeground,
                                )
                                Text(
                                    m.fecha + (m.observacion?.let { " · $it" } ?: ""),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = AppColors.mutedForeground,
                                )
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
    }

    if (modal == "potrero") {
        CrearPotreroModal(
            onCerrar = { modal = null },
            onCreado = { modal = null; recarga++ },
        )
    }
    if (modal == "movimiento") {
        CrearMovimientoModal(
            potreros = potreros.ifEmpty { SyncStore.potrerosCache },
            onCerrar = { modal = null },
            onCreado = { modal = null; pagina = 1; recarga++ },
            onOffline = { aviso ->
                modal = null
                avisoOffline = aviso
            },
        )
    }
}

@Composable
private fun CrearPotreroModal(onCerrar: () -> Unit, onCreado: () -> Unit) {
    var nombre by remember { mutableStateOf("") }
    var hectareas by remember { mutableStateOf("") }
    var tipoPasto by remember { mutableStateOf("") }
    var capacidad by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var guardando by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Modal("Nuevo potrero", onCerrar) {
        CampoTexto(nombre, { nombre = it }, "Nombre *")
        CampoTexto(hectareas, { hectareas = it }, "Hectáreas")
        CampoTexto(tipoPasto, { tipoPasto = it }, "Tipo de pasto")
        CampoTexto(capacidad, { capacidad = it }, "Capacidad estimada (animales)")
        error?.let { MensajeError(it) }
        BotonPrimario(
            texto = if (guardando) "Guardando…" else "Crear potrero",
            habilitado = !guardando && nombre.isNotBlank(),
            onClick = {
                guardando = true
                error = null
                scope.launch {
                    try {
                        Api.crearPotrero(
                            CrearPotreroRequest(
                                nombre = nombre.trim(),
                                hectareas = hectareas.toDoubleOrNull(),
                                tipoPasto = tipoPasto.trim().ifBlank { null },
                                capacidadEstimada = capacidad.toIntOrNull(),
                            ),
                        )
                        onCreado()
                    } catch (e: Exception) {
                        error = e.message ?: "No se pudo crear"
                    } finally {
                        guardando = false
                    }
                }
            },
        )
    }
}

@Composable
private fun CrearMovimientoModal(
    potreros: List<Potrero>,
    onCerrar: () -> Unit,
    onCreado: () -> Unit,
    onOffline: (String) -> Unit,
) {
    val animales = SyncStore.animalesCache.filter { it.estado == "activo" || it.estado == "en_tratamiento" }
    var animalId by remember { mutableStateOf(animales.firstOrNull()?.id ?: "") }
    var origenId by remember { mutableStateOf(potreros.firstOrNull()?.id ?: "") }
    var destinoId by remember { mutableStateOf(potreros.getOrNull(1)?.id ?: "") }
    var fecha by remember { mutableStateOf(hoyIso()) }
    var observacion by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var guardando by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Modal("Registrar movimiento", onCerrar) {
        if (animales.isEmpty()) {
            Text(
                "Abre primero el listado de Animales con señal para poder elegir el animal.",
                style = MaterialTheme.typography.bodySmall,
                color = AppColors.mutedForeground,
            )
        }
        Selector("Animal *", animales.map { it.id to it.codigo }, animalId, { animalId = it })
        Selector("Potrero origen *", potreros.map { it.id to it.nombre }, origenId, { origenId = it })
        Selector("Potrero destino *", potreros.map { it.id to it.nombre }, destinoId, { destinoId = it })
        CampoTexto(fecha, { fecha = it }, "Fecha (YYYY-MM-DD) *")
        CampoTexto(observacion, { observacion = it }, "Observación")
        error?.let { MensajeError(it) }
        BotonPrimario(
            texto = if (guardando) "Guardando…" else "Registrar movimiento",
            habilitado = !guardando && animalId.isNotBlank() && origenId.isNotBlank() &&
                destinoId.isNotBlank() && origenId != destinoId,
            onClick = {
                guardando = true
                error = null
                scope.launch {
                    try {
                        Api.crearMovimiento(
                            CrearMovimientoRequest(
                                animalId = animalId,
                                potreroOrigenId = origenId,
                                potreroDestinoId = destinoId,
                                fecha = fecha,
                                observacion = observacion.trim().ifBlank { null },
                            ),
                        )
                        onCreado()
                    } catch (e: SinConexionException) {
                        val codigo = animales.firstOrNull { it.id == animalId }?.codigo ?: animalId
                        SyncStore.encolar(
                            AccionPendiente(
                                tipo = "registrar_movimiento",
                                timestampLocal = ahoraIso(),
                                etiqueta = "Movimiento — $codigo",
                                datosMovimiento = DatosMovimiento(animalId, origenId, destinoId, fecha),
                            ),
                        )
                        onOffline("Sin señal: movimiento guardado offline, sincroniza desde Más")
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
