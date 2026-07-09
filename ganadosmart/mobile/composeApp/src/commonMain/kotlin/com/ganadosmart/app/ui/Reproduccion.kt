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
import com.ganadosmart.app.data.Api
import com.ganadosmart.app.data.BecerroRequest
import com.ganadosmart.app.data.ConfirmarPartoRequest
import com.ganadosmart.app.data.CrearReproduccionRequest
import com.ganadosmart.app.data.Reproduccion
import com.ganadosmart.app.data.Session
import com.ganadosmart.app.data.SyncStore
import com.ganadosmart.app.hoyIso
import com.ganadosmart.app.theme.AppColors
import com.ganadosmart.app.theme.AppIcons
import kotlinx.coroutines.launch

private fun estadoReproVariant(estado: String): BadgeVariant = when (estado) {
    "exitoso" -> BadgeVariant.Green
    "fallido" -> BadgeVariant.Red
    else -> BadgeVariant.Purple
}

@Composable
fun ReproduccionScreen() {
    var registros by remember { mutableStateOf<List<Reproduccion>>(emptyList()) }
    var filtro by remember { mutableStateOf("todos") }
    var pagina by remember { mutableIntStateOf(1) }
    var totalPaginas by remember { mutableIntStateOf(1) }
    var cargando by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var recarga by remember { mutableIntStateOf(0) }
    var mostrarCrear by remember { mutableStateOf(false) }
    var confirmando by remember { mutableStateOf<Reproduccion?>(null) }

    // codigo por id para mostrar toro/vaca legibles (como la web)
    val codigos = remember(recarga) {
        SyncStore.animalesCache.associate { it.id to it.codigo }
    }

    LaunchedEffect(filtro, pagina, recarga) {
        cargando = true
        error = null
        try {
            val resp = Api.reproducciones(
                estado = filtro.takeIf { it != "todos" },
                pagina = pagina,
                limite = 20,
            )
            registros = if (pagina == 1) resp.datos else registros + resp.datos
            totalPaginas = resp.meta.totalPaginas
        } catch (e: Exception) {
            error = e.message
        }
        cargando = false
    }

    Scaffold(
        containerColor = AppColors.background,
        floatingActionButton = {
            if (Session.esCampo) {
                FloatingActionButton(
                    onClick = { mostrarCrear = true },
                    containerColor = AppColors.amber600,
                    contentColor = Color.White,
                ) { Icon(AppIcons.Plus, contentDescription = "Nuevo registro") }
            }
        },
    ) { _ ->
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Encabezado("Reproducción", "Montas, inseminaciones y partos")

            FilterChips(
                opciones = listOf(
                    "todos" to "Todos",
                    "en_curso" to "En curso",
                    "exitoso" to "Exitosos",
                    "fallido" to "Fallidos",
                ),
                seleccionado = filtro,
                onSeleccion = { filtro = it; pagina = 1 },
            )
            Spacer(Modifier.height(10.dp))
            error?.let { MensajeError(it) }

            if (cargando && registros.isEmpty()) {
                Cargando()
            } else if (registros.isEmpty()) {
                EstadoVacio("No hay registros reproductivos.")
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(registros, key = { it.id }) { r ->
                        AppCard {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Column {
                                    Text(
                                        "Vaca: ${codigos[r.vacaId] ?: r.vacaId.take(8)}",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = AppColors.foreground,
                                    )
                                    Text(
                                        when {
                                            r.toroId != null -> "Toro: ${codigos[r.toroId] ?: r.toroId.take(8)}"
                                            r.pajillaProveedor != null ->
                                                "Pajilla — ${r.pajillaProveedor} (${r.pajillaRaza})"
                                            else -> ""
                                        },
                                        style = MaterialTheme.typography.bodySmall,
                                        color = AppColors.mutedForeground,
                                    )
                                    Text(
                                        "${if (r.tipo == "monta_natural") "Monta natural" else "Inseminación"} · ${r.fecha}" +
                                            (r.fechaProbableParto?.let { " · parto ~$it" } ?: ""),
                                        style = MaterialTheme.typography.bodySmall,
                                        color = AppColors.mutedForeground,
                                    )
                                }
                                Badge(
                                    when (r.estado) {
                                        "en_curso" -> "En curso"
                                        "exitoso" -> "Exitoso"
                                        else -> "Fallido"
                                    },
                                    estadoReproVariant(r.estado),
                                )
                            }
                            if (r.estado == "en_curso" && Session.esCampo) {
                                Spacer(Modifier.height(8.dp))
                                BotonPrimario(
                                    "Confirmar parto",
                                    color = AppColors.emerald600,
                                    onClick = { confirmando = r },
                                )
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
        CrearReproduccionModal(
            onCerrar = { mostrarCrear = false },
            onCreado = { mostrarCrear = false; pagina = 1; recarga++ },
        )
    }
    confirmando?.let { repro ->
        ConfirmarPartoModal(
            reproduccion = repro,
            onCerrar = { confirmando = null },
            onConfirmado = { confirmando = null; pagina = 1; recarga++ },
        )
    }
}

@Composable
private fun CrearReproduccionModal(onCerrar: () -> Unit, onCreado: () -> Unit) {
    val animales = remember { SyncStore.animalesCache }
    // mismos filtros que la web: toros/vacas adultos y vivos
    val toros = animales.filter { it.categoria == "toro" && (it.estado == "activo" || it.estado == "en_tratamiento") }
    val vacas = animales.filter { it.categoria == "vaca" && (it.estado == "activo" || it.estado == "en_tratamiento") }

    var tipo by remember { mutableStateOf("monta_natural") }
    var origen by remember { mutableStateOf("toro") } // toro | pajilla (solo inseminación)
    var toroId by remember { mutableStateOf(toros.firstOrNull()?.id ?: "") }
    var vacaId by remember { mutableStateOf(vacas.firstOrNull()?.id ?: "") }
    var pajillaProveedor by remember { mutableStateOf("") }
    var pajillaRaza by remember { mutableStateOf("") }
    var fecha by remember { mutableStateOf(hoyIso()) }
    var error by remember { mutableStateOf<String?>(null) }
    var guardando by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Modal("Nuevo registro reproductivo", onCerrar) {
        if (vacas.isEmpty()) {
            Text(
                "Abre primero el listado de Animales con señal para poder elegir toro/vaca.",
                style = MaterialTheme.typography.bodySmall,
                color = AppColors.mutedForeground,
            )
        }
        Selector(
            "Tipo *",
            listOf("monta_natural" to "Monta natural", "inseminacion" to "Inseminación"),
            tipo,
            { tipo = it },
        )
        if (tipo == "inseminacion") {
            Selector(
                "Origen del semen *",
                listOf("toro" to "Toro de la finca", "pajilla" to "Pajilla externa"),
                origen,
                { origen = it },
            )
        }
        if (tipo == "monta_natural" || origen == "toro") {
            Selector("Toro *", toros.map { it.id to it.codigo }, toroId, { toroId = it })
        } else {
            CampoTexto(pajillaProveedor, { pajillaProveedor = it }, "Proveedor de la pajilla *")
            CampoTexto(pajillaRaza, { pajillaRaza = it }, "Raza de la pajilla *")
        }
        Selector("Vaca *", vacas.map { it.id to it.codigo }, vacaId, { vacaId = it })
        CampoTexto(fecha, { fecha = it }, "Fecha del evento (YYYY-MM-DD) *")
        error?.let { MensajeError(it) }

        val usaPajilla = tipo == "inseminacion" && origen == "pajilla"
        BotonPrimario(
            texto = if (guardando) "Guardando…" else "Registrar",
            habilitado = !guardando && vacaId.isNotBlank() &&
                (if (usaPajilla) pajillaProveedor.isNotBlank() && pajillaRaza.isNotBlank() else toroId.isNotBlank()),
            onClick = {
                guardando = true
                error = null
                scope.launch {
                    try {
                        Api.crearReproduccion(
                            CrearReproduccionRequest(
                                vacaId = vacaId,
                                tipo = tipo,
                                fecha = fecha,
                                toroId = if (usaPajilla) null else toroId,
                                pajillaProveedor = pajillaProveedor.trim().ifBlank { null }.takeIf { usaPajilla },
                                pajillaRaza = pajillaRaza.trim().ifBlank { null }.takeIf { usaPajilla },
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

@Composable
private fun ConfirmarPartoModal(
    reproduccion: Reproduccion,
    onCerrar: () -> Unit,
    onConfirmado: () -> Unit,
) {
    var resultado by remember { mutableStateOf("exitoso") }
    var codigo by remember { mutableStateOf("") }
    var sexo by remember { mutableStateOf("hembra") }
    var peso by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var guardando by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Modal("Confirmar parto", onCerrar) {
        Selector(
            "Resultado *",
            listOf("exitoso" to "Exitoso (nació el becerro)", "fallido" to "Fallido"),
            resultado,
            { resultado = it },
        )
        if (resultado == "exitoso") {
            CampoTexto(codigo, { codigo = it }, "Código del becerro *")
            Selector("Sexo del becerro *", listOf("hembra" to "Hembra", "macho" to "Macho"), sexo, { sexo = it })
            CampoTexto(peso, { peso = it }, "Peso al nacer (kg)")
        }
        error?.let { MensajeError(it) }
        BotonPrimario(
            texto = if (guardando) "Guardando…" else "Confirmar",
            color = AppColors.emerald600,
            habilitado = !guardando && (resultado == "fallido" || codigo.isNotBlank()),
            onClick = {
                guardando = true
                error = null
                scope.launch {
                    try {
                        Api.confirmarParto(
                            reproduccion.id,
                            ConfirmarPartoRequest(
                                resultado = resultado,
                                becerro = if (resultado == "exitoso") {
                                    BecerroRequest(
                                        sexo = sexo,
                                        codigo = codigo.trim(),
                                        pesoNacimiento = peso.toDoubleOrNull(),
                                    )
                                } else null,
                            ),
                        )
                        onConfirmado()
                    } catch (e: Exception) {
                        error = e.message ?: "No se pudo confirmar"
                    } finally {
                        guardando = false
                    }
                }
            },
        )
    }
}
