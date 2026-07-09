package com.ganadosmart.app.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.background
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ganadosmart.app.data.AccionPendiente
import com.ganadosmart.app.data.AnimalDetalle
import com.ganadosmart.app.data.AnimalItem
import com.ganadosmart.app.data.Api
import com.ganadosmart.app.data.CrearAnimalRequest
import com.ganadosmart.app.data.DatosMortalidad
import com.ganadosmart.app.data.DatosPeso
import com.ganadosmart.app.data.RegistrarMortalidadRequest
import com.ganadosmart.app.data.RegistrarPesoRequest
import com.ganadosmart.app.data.Session
import com.ganadosmart.app.data.SinConexionException
import com.ganadosmart.app.data.SyncStore
import com.ganadosmart.app.ahoraIso
import com.ganadosmart.app.hoyIso
import com.ganadosmart.app.theme.AppColors
import com.ganadosmart.app.theme.AppIcons
import kotlinx.coroutines.launch

@Composable
fun AnimalesScreen() {
    var seleccionado by remember { mutableStateOf<String?>(null) }
    val id = seleccionado
    if (id != null) {
        AnimalDetalleScreen(animalId = id, onVolver = { seleccionado = null })
    } else {
        AnimalesListado(onAbrir = { seleccionado = it })
    }
}

// ── Listado ──

@Composable
private fun AnimalesListado(onAbrir: (String) -> Unit) {
    var animales by remember { mutableStateOf<List<AnimalItem>>(emptyList()) }
    var filtroEstado by remember { mutableStateOf("todos") }
    var pagina by remember { mutableIntStateOf(1) }
    var totalPaginas by remember { mutableIntStateOf(1) }
    var total by remember { mutableIntStateOf(0) }
    var cargando by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var offline by remember { mutableStateOf(false) }
    var mostrarCrear by remember { mutableStateOf(false) }
    var recarga by remember { mutableIntStateOf(0) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(filtroEstado, pagina, recarga) {
        cargando = true
        error = null
        try {
            val resp = Api.animales(
                estado = filtroEstado.takeIf { it != "todos" },
                pagina = pagina,
                limite = 20,
            )
            animales = if (pagina == 1) resp.datos else animales + resp.datos
            totalPaginas = resp.meta.totalPaginas
            total = resp.meta.totalRegistros
            offline = false
            // caché para operar sin señal
            if (pagina == 1 && filtroEstado == "todos") SyncStore.animalesCache = resp.datos
        } catch (e: SinConexionException) {
            // sin señal en el potrero: se trabaja con el último listado conocido
            animales = SyncStore.animalesCache
            offline = true
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
                ) {
                    Icon(AppIcons.Plus, contentDescription = "Nuevo animal")
                }
            }
        },
    ) { _ ->
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Encabezado("Animales", "$total en el hato")

            FilterChips(
                opciones = listOf(
                    "todos" to "Todos",
                    "activo" to "Activos",
                    "en_tratamiento" to "En tratamiento",
                    "vendido" to "Vendidos",
                    "muerto" to "Muertos",
                ),
                seleccionado = filtroEstado,
                onSeleccion = {
                    filtroEstado = it
                    pagina = 1
                },
            )
            Spacer(Modifier.height(10.dp))

            if (offline) {
                Badge("Sin conexión — mostrando datos guardados", BadgeVariant.Orange)
                Spacer(Modifier.height(8.dp))
            }
            error?.let { MensajeError(it) }

            if (cargando && animales.isEmpty()) {
                Cargando("Cargando animales…")
            } else if (animales.isEmpty()) {
                EstadoVacio("No hay animales que coincidan.")
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(animales, key = { it.id }) { animal ->
                        AppCard(modifier = Modifier.clickable { onAbrir(animal.id) }) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Column {
                                    Text(
                                        animal.codigo,
                                        style = MaterialTheme.typography.titleMedium,
                                        color = AppColors.foreground,
                                    )
                                    Text(
                                        "${animal.categoria} · ${animal.sexo}" +
                                            (animal.raza?.let { " · $it" } ?: ""),
                                        style = MaterialTheme.typography.bodySmall,
                                        color = AppColors.mutedForeground,
                                    )
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Badge(estadoAnimalLabel(animal.estado), estadoAnimalVariant(animal.estado))
                                    Spacer(Modifier.height(4.dp))
                                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                        animal.pesoActual?.let {
                                            Text(
                                                "${numero(it)} kg",
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Black,
                                                color = AppColors.foreground,
                                            )
                                        }
                                        if (animal.enGestacion) Badge("Gestación", BadgeVariant.Purple)
                                    }
                                }
                            }
                        }
                    }
                    item {
                        CargarMas(
                            hayMas = pagina < totalPaginas && !offline,
                            cargando = cargando,
                            onCargar = { pagina++ },
                        )
                        Spacer(Modifier.height(70.dp)) // aire para el FAB
                    }
                }
            }
        }
    }

    if (mostrarCrear) {
        CrearAnimalModal(
            onCerrar = { mostrarCrear = false },
            onCreado = {
                mostrarCrear = false
                pagina = 1
                recarga++
            },
        )
    }
}

@Composable
private fun CrearAnimalModal(onCerrar: () -> Unit, onCreado: () -> Unit) {
    var codigo by remember { mutableStateOf("") }
    var categoria by remember { mutableStateOf("vaca") }
    var sexo by remember { mutableStateOf("hembra") }
    var raza by remember { mutableStateOf("") }
    var fechaNacimiento by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var guardando by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Modal("Nuevo animal", onCerrar) {
        CampoTexto(codigo, { codigo = it }, "Código (caravana/arete) *")
        Selector(
            "Categoría *",
            listOf("vaca" to "Vaca", "toro" to "Toro", "becerro" to "Becerro"),
            categoria,
            { categoria = it },
        )
        Selector(
            "Sexo *",
            listOf("hembra" to "Hembra", "macho" to "Macho"),
            sexo,
            { sexo = it },
        )
        CampoTexto(raza, { raza = it }, "Raza")
        CampoTexto(fechaNacimiento, { fechaNacimiento = it }, "Fecha nacimiento (YYYY-MM-DD)")
        error?.let { MensajeError(it) }
        BotonPrimario(
            texto = if (guardando) "Guardando…" else "Registrar animal",
            habilitado = !guardando && codigo.isNotBlank(),
            onClick = {
                guardando = true
                error = null
                scope.launch {
                    try {
                        Api.crearAnimal(
                            CrearAnimalRequest(
                                codigo = codigo.trim(),
                                categoria = categoria,
                                sexo = sexo,
                                raza = raza.trim().ifBlank { null },
                                fechaNacimiento = fechaNacimiento.trim().ifBlank { null },
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

// ── Ficha del animal ──

@Composable
private fun AnimalDetalleScreen(animalId: String, onVolver: () -> Unit) {
    var animal by remember { mutableStateOf<AnimalDetalle?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var recarga by remember { mutableIntStateOf(0) }
    var modal by remember { mutableStateOf<String?>(null) } // peso | mortalidad | reactivar | solicitar | foto
    var avisoOffline by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(animalId, recarga) {
        try {
            animal = Api.animal(animalId)
            error = null
        } catch (e: SinConexionException) {
            error = "Sin conexión — la ficha completa requiere señal"
        } catch (e: Exception) {
            error = e.message
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Encabezado(animal?.codigo ?: "Animal", "Ficha del animal", onVolver = onVolver)

        error?.let { MensajeError(it) }
        avisoOffline?.let {
            Badge(it, BadgeVariant.Orange)
        }
        val a = animal ?: run {
            if (error == null) Cargando()
            return@Column
        }

        AppCard {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Badge(estadoAnimalLabel(a.estado), estadoAnimalVariant(a.estado))
                if (a.enGestacion) Badge("En gestación", BadgeVariant.Purple)
            }
            Spacer(Modifier.height(8.dp))
            FilaDato("Categoría", a.categoria)
            FilaDato("Sexo", a.sexo)
            FilaDato("Raza", a.raza ?: "—")
            FilaDato("Nacimiento", a.fechaNacimiento ?: "—")
            FilaDato("Peso actual", a.pesoActual?.let { "${numero(it)} kg" } ?: "—")
            FilaDato(
                "Valor comercial",
                (a.valorComercialAjustado ?: a.valorComercialEstimado)?.let { moneda(it) } ?: "—",
            )
            FilaDato("Inseminaciones", a.conteoReproduccion.inseminaciones.toString())
            FilaDato("Servicios (toro)", a.conteoReproduccion.servicios.toString())
        }

        if (a.historialPeso.isNotEmpty()) {
            AppCard {
                Text(
                    "HISTORIAL DE PESO",
                    style = MaterialTheme.typography.labelSmall,
                    color = AppColors.mutedForeground,
                    modifier = Modifier.padding(bottom = 6.dp),
                )
                a.historialPeso.take(8).forEach { p ->
                    FilaDato(p.fecha, "${numero(p.pesoKg)} kg")
                }
            }
        }

        // ── Acciones según rol y estado (mismo gating que la web) ──
        val vivo = a.estado == "activo" || a.estado == "en_tratamiento"
        if (Session.esCampo && vivo) {
            BotonPrimario("Registrar peso", onClick = { modal = "peso" })
            BotonPrimario("Registrar mortalidad", color = AppColors.red500, onClick = { modal = "mortalidad" })
            BotonPrimario("Cambiar foto (URL)", color = AppColors.muted, onClick = { modal = "foto" })
        }
        if (a.estado == "muerto") {
            if (Session.esDueno) {
                BotonPrimario("Reactivar (fue un error)", color = AppColors.emerald600, onClick = { modal = "reactivar" })
            } else if (Session.esAdmin) {
                BotonPrimario("Solicitar reactivación al dueño", color = AppColors.muted, onClick = { modal = "solicitar" })
            }
        }
        Spacer(Modifier.height(20.dp))
    }

    val scope = rememberCoroutineScope()
    when (modal) {
        "peso" -> PesoModal(
            onCerrar = { modal = null },
            onGuardar = { pesoKg, fecha, alTerminar ->
                scope.launch {
                    try {
                        Api.registrarPeso(animalId, RegistrarPesoRequest(pesoKg, fecha))
                        modal = null
                        recarga++
                    } catch (e: SinConexionException) {
                        SyncStore.encolar(
                            AccionPendiente(
                                tipo = "registrar_peso",
                                timestampLocal = ahoraIso(),
                                etiqueta = "Peso ${numero(pesoKg)} kg — ${animal?.codigo ?: animalId}",
                                datosPeso = DatosPeso(animalId, pesoKg, fecha),
                            ),
                        )
                        modal = null
                        avisoOffline = "Sin señal: peso guardado offline, sincroniza desde Más"
                    } catch (e: Exception) {
                        alTerminar(e.message ?: "No se pudo registrar el peso")
                    }
                }
            },
        )

        "mortalidad" -> MortalidadModal(
            onCerrar = { modal = null },
            onGuardar = { causa, fecha, alTerminar ->
                scope.launch {
                    try {
                        Api.registrarMortalidad(animalId, RegistrarMortalidadRequest(fecha, causa))
                        modal = null
                        recarga++
                    } catch (e: SinConexionException) {
                        SyncStore.encolar(
                            AccionPendiente(
                                tipo = "registrar_mortalidad",
                                timestampLocal = ahoraIso(),
                                etiqueta = "Mortalidad — ${animal?.codigo ?: animalId}",
                                datosMortalidad = DatosMortalidad(animalId, fecha, causa),
                            ),
                        )
                        modal = null
                        avisoOffline = "Sin señal: mortalidad guardada offline, sincroniza desde Más"
                    } catch (e: Exception) {
                        alTerminar(e.message ?: "No se pudo registrar")
                    }
                }
            },
        )

        "reactivar", "solicitar" -> MotivoModal(
            titulo = if (modal == "reactivar") "Reactivar animal" else "Solicitar reactivación",
            boton = if (modal == "reactivar") "Reactivar" else "Enviar solicitud",
            onCerrar = { modal = null },
            onGuardar = { motivo, alTerminar ->
                scope.launch {
                    try {
                        if (modal == "reactivar") {
                            Api.reactivarAnimal(animalId, motivo)
                        } else {
                            Api.solicitarReactivacion(animalId, motivo)
                        }
                        modal = null
                        recarga++
                    } catch (e: Exception) {
                        alTerminar(e.message ?: "No se pudo completar")
                    }
                }
            },
        )

        "foto" -> FotoModal(
            onCerrar = { modal = null },
            onGuardar = { url, alTerminar ->
                scope.launch {
                    try {
                        Api.actualizarFoto(animalId, url)
                        modal = null
                        recarga++
                    } catch (e: Exception) {
                        alTerminar(e.message ?: "No se pudo actualizar la foto")
                    }
                }
            },
        )
    }
}

// ── Modales de acción ──

@Composable
private fun PesoModal(onCerrar: () -> Unit, onGuardar: (Double, String, (String) -> Unit) -> Unit) {
    var peso by remember { mutableStateOf("") }
    var fecha by remember { mutableStateOf(hoyIso()) }
    var error by remember { mutableStateOf<String?>(null) }

    Modal("Registrar peso", onCerrar) {
        CampoTexto(peso, { peso = it }, "Peso (kg) *")
        CampoTexto(fecha, { fecha = it }, "Fecha (YYYY-MM-DD) *")
        error?.let { MensajeError(it) }
        BotonPrimario(
            "Guardar peso",
            habilitado = peso.toDoubleOrNull()?.let { it > 0 } == true,
            onClick = {
                onGuardar(peso.toDouble(), fecha) { error = it }
            },
        )
    }
}

@Composable
private fun MortalidadModal(onCerrar: () -> Unit, onGuardar: (String, String, (String) -> Unit) -> Unit) {
    var causa by remember { mutableStateOf("") }
    var fecha by remember { mutableStateOf(hoyIso()) }
    var error by remember { mutableStateOf<String?>(null) }

    Modal("Registrar mortalidad", onCerrar) {
        CampoTexto(causa, { causa = it }, "Causa *")
        CampoTexto(fecha, { fecha = it }, "Fecha (YYYY-MM-DD) *")
        error?.let { MensajeError(it) }
        BotonPrimario(
            "Registrar muerte",
            color = AppColors.red500,
            habilitado = causa.isNotBlank(),
            onClick = { onGuardar(causa.trim(), fecha) { error = it } },
        )
    }
}

@Composable
private fun MotivoModal(
    titulo: String,
    boton: String,
    onCerrar: () -> Unit,
    onGuardar: (String, (String) -> Unit) -> Unit,
) {
    var motivo by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    Modal(titulo, onCerrar) {
        CampoTexto(motivo, { motivo = it }, "Motivo *")
        error?.let { MensajeError(it) }
        BotonPrimario(
            boton,
            habilitado = motivo.isNotBlank(),
            onClick = { onGuardar(motivo.trim()) { error = it } },
        )
    }
}

@Composable
private fun FotoModal(onCerrar: () -> Unit, onGuardar: (String, (String) -> Unit) -> Unit) {
    var url by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    Modal("Foto del animal", onCerrar) {
        Text(
            "Pega la URL de una imagen ya alojada (el sistema no sube archivos desde el móvil todavía).",
            style = MaterialTheme.typography.bodySmall,
            color = AppColors.mutedForeground,
        )
        CampoTexto(url, { url = it }, "URL de la foto *")
        error?.let { MensajeError(it) }
        BotonPrimario(
            "Guardar foto",
            habilitado = url.startsWith("http"),
            onClick = { onGuardar(url.trim()) { error = it } },
        )
    }
}
