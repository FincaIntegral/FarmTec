package com.ganadosmart.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ganadosmart.app.data.Api
import com.ganadosmart.app.data.CrearGastoRequest
import com.ganadosmart.app.data.Gasto
import com.ganadosmart.app.data.Session
import com.ganadosmart.app.hoyIso
import com.ganadosmart.app.theme.AppColors
import com.ganadosmart.app.theme.AppIcons
import kotlinx.coroutines.launch

private val CATEGORIAS = listOf(
    "insumos" to "Insumos",
    "nomina" to "Nómina",
    "veterinario" to "Veterinario",
    "otro" to "Otro",
)

private fun categoriaLabel(c: String): String = CATEGORIAS.firstOrNull { it.first == c }?.second ?: c

private fun categoriaColor(c: String): Color = when (c) {
    "insumos" -> AppColors.amber500
    "nomina" -> AppColors.blue500
    "veterinario" -> AppColors.purple500
    else -> AppColors.gray400
}

@Composable
fun GastosScreen(onVolver: () -> Unit) {
    var gastos by remember { mutableStateOf<List<Gasto>>(emptyList()) }
    var todosParaGrafico by remember { mutableStateOf<List<Gasto>>(emptyList()) }
    var filtro by remember { mutableStateOf("todos") }
    var pagina by remember { mutableIntStateOf(1) }
    var totalPaginas by remember { mutableIntStateOf(1) }
    var total by remember { mutableIntStateOf(0) }
    var cargando by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var recarga by remember { mutableIntStateOf(0) }
    var mostrarCrear by remember { mutableStateOf(false) }
    var rechazando by remember { mutableStateOf<Gasto?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(filtro, pagina, recarga) {
        cargando = true
        error = null
        try {
            val resp = Api.gastos(
                categoria = filtro.takeIf { it != "todos" },
                pagina = pagina,
                limite = 20,
            )
            gastos = if (pagina == 1) resp.datos else gastos + resp.datos
            totalPaginas = resp.meta.totalPaginas
            total = resp.meta.totalRegistros
        } catch (e: Exception) {
            error = e.message
        }
        cargando = false
    }

    // ponytail: mismo criterio que la web — lote de hasta 100 para el gráfico
    LaunchedEffect(recarga) {
        runCatching { todosParaGrafico = Api.gastos(limite = 100).datos }
    }

    Scaffold(
        containerColor = AppColors.background,
        floatingActionButton = {
            FloatingActionButton(
                onClick = { mostrarCrear = true },
                containerColor = AppColors.amber600,
                contentColor = Color.White,
            ) { Icon(AppIcons.Plus, contentDescription = "Nuevo gasto") }
        },
    ) { _ ->
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Encabezado("Gastos", "$total gastos registrados", onVolver = onVolver)

            // Gráfico de barras por categoría (como la web)
            if (todosParaGrafico.isNotEmpty()) {
                val totales = CATEGORIAS.map { (valor, etiqueta) ->
                    Triple(etiqueta, todosParaGrafico.filter { it.categoria == valor }.sumOf { it.monto }, categoriaColor(valor))
                }
                val max = totales.maxOf { it.second }.coerceAtLeast(1.0)
                AppCard {
                    Text(
                        "GASTOS POR CATEGORÍA",
                        style = MaterialTheme.typography.labelSmall,
                        color = AppColors.mutedForeground,
                        modifier = Modifier.padding(bottom = 8.dp),
                    )
                    totales.forEach { (etiqueta, monto, color) ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp),
                        ) {
                            Text(
                                etiqueta,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = AppColors.mutedForeground,
                                modifier = Modifier.width(72.dp),
                            )
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(14.dp)
                                    .background(AppColors.muted, RoundedCornerShape(4.dp)),
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth(fraction = (monto / max).toFloat().coerceIn(0f, 1f))
                                        .fillMaxHeight()
                                        .background(color, RoundedCornerShape(4.dp)),
                                )
                            }
                            Text(
                                moneda(monto),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black,
                                color = AppColors.foreground,
                                modifier = Modifier.padding(start = 8.dp),
                            )
                        }
                    }
                }
                Spacer(Modifier.height(10.dp))
            }

            FilterChips(
                opciones = listOf("todos" to "Todos") + CATEGORIAS,
                seleccionado = filtro,
                onSeleccion = { filtro = it; pagina = 1 },
            )
            Spacer(Modifier.height(10.dp))
            error?.let { MensajeError(it) }

            if (cargando && gastos.isEmpty()) {
                Cargando()
            } else if (gastos.isEmpty()) {
                EstadoVacio("No hay gastos que coincidan.")
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(gastos, key = { it.id }) { g ->
                        AppCard {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Column {
                                    Text(
                                        categoriaLabel(g.categoria),
                                        style = MaterialTheme.typography.titleMedium,
                                        color = AppColors.foreground,
                                    )
                                    Text(
                                        g.fecha + (g.descripcion?.let { " · $it" } ?: ""),
                                        style = MaterialTheme.typography.bodySmall,
                                        color = AppColors.mutedForeground,
                                    )
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text(
                                        moneda(g.monto),
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Black,
                                        color = AppColors.foreground,
                                    )
                                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Badge(
                                            estadoAprobacionLabel(g.estadoAprobacion),
                                            estadoAprobacionVariant(g.estadoAprobacion),
                                        )
                                        if (g.autoAprobado) Badge("Auto", BadgeVariant.Sky)
                                    }
                                }
                            }
                            if (g.estadoAprobacion == "pendiente" && Session.esDueno) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End,
                                ) {
                                    TextButton(onClick = {
                                        scope.launch {
                                            try {
                                                Api.aprobarGasto(g.id)
                                                pagina = 1; recarga++
                                            } catch (e: Exception) {
                                                error = e.message
                                            }
                                        }
                                    }) {
                                        Text("Aprobar", color = AppColors.emerald400, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                    }
                                    TextButton(onClick = { rechazando = g }) {
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
        CrearGastoModal(
            onCerrar = { mostrarCrear = false },
            onCreado = { mostrarCrear = false; pagina = 1; recarga++ },
        )
    }
    rechazando?.let { gasto ->
        MotivoRechazoModal(
            titulo = "Rechazar gasto — ${categoriaLabel(gasto.categoria)}",
            onCerrar = { rechazando = null },
            onRechazar = { motivo, alError ->
                scope.launch {
                    try {
                        Api.rechazarGasto(gasto.id, motivo)
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
private fun CrearGastoModal(onCerrar: () -> Unit, onCreado: () -> Unit) {
    var categoria by remember { mutableStateOf("insumos") }
    var monto by remember { mutableStateOf("") }
    var descripcion by remember { mutableStateOf("") }
    var fecha by remember { mutableStateOf(hoyIso()) }
    var error by remember { mutableStateOf<String?>(null) }
    var guardando by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Modal("Nuevo gasto", onCerrar) {
        Selector("Categoría *", CATEGORIAS, categoria, { categoria = it })
        CampoTexto(monto, { monto = it }, "Monto *")
        CampoTexto(fecha, { fecha = it }, "Fecha (YYYY-MM-DD) *")
        CampoTexto(descripcion, { descripcion = it }, "Descripción (opcional)")
        error?.let { MensajeError(it) }
        BotonPrimario(
            texto = if (guardando) "Guardando…" else "Registrar gasto",
            habilitado = !guardando && (monto.toDoubleOrNull() ?: 0.0) > 0,
            onClick = {
                guardando = true
                error = null
                scope.launch {
                    try {
                        Api.crearGasto(
                            CrearGastoRequest(
                                categoria = categoria,
                                monto = monto.toDouble(),
                                fecha = fecha,
                                descripcion = descripcion.trim().ifBlank { null },
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
