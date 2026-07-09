package com.ganadosmart.app.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ganadosmart.app.data.Api
import com.ganadosmart.app.data.MortalidadRegistro
import com.ganadosmart.app.hoyIso
import com.ganadosmart.app.theme.AppColors

private val PALETA = listOf(
    AppColors.purple500,
    AppColors.blue500,
    AppColors.amber500,
    AppColors.emerald400,
    AppColors.red500,
    AppColors.gray400,
    AppColors.sky400,
    AppColors.orange400,
)

@Composable
fun MortalidadScreen(onVolver: () -> Unit) {
    var registros by remember { mutableStateOf<List<MortalidadRegistro>>(emptyList()) }
    var tasa by remember { mutableStateOf(0.0) }
    var cargando by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        runCatching { tasa = Api.dashboard().tasaMortalidad }
        try {
            registros = Api.mortalidad()
        } catch (e: Exception) {
            error = e.message
        }
        cargando = false
    }

    // hoy = "YYYY-MM-DD"; ventana 12m = mismo mes del año anterior
    val hoy = hoyIso()
    val anio = hoy.take(4).toInt()
    val mes = hoy.substring(5, 7).toInt()
    fun claveMes(offset: Int): String {
        var a = anio
        var m = mes - offset
        while (m <= 0) { m += 12; a-- }
        return "$a-" + m.toString().padStart(2, '0')
    }

    val meses12 = (11 downTo 0).map { claveMes(it) }
    val muertes12m = registros.count { it.fecha.take(7) in meses12 }
    val meses12Previos = (23 downTo 12).map { claveMes(it) }
    val muertesPrevias = registros.count { it.fecha.take(7) in meses12Previos }
    val variacion = when {
        muertesPrevias == 0 && muertes12m == 0 -> 0
        muertesPrevias == 0 -> 100
        else -> ((muertes12m - muertesPrevias) * 100) / muertesPrevias
    }

    val causas = registros.groupBy { it.causa }.mapValues { it.value.size }
        .entries.sortedByDescending { it.value }
    val causaPrincipal = causas.firstOrNull()?.key ?: "—"

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Encabezado("Mortalidad", "Análisis de muertes del hato", onVolver = onVolver)
        error?.let { MensajeError(it) }
        if (cargando) {
            Cargando()
            return@Column
        }

        // ── KPIs ──
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            AppCard(modifier = Modifier.weight(1f)) {
                Text("MUERTES (12M)", style = MaterialTheme.typography.labelSmall, color = AppColors.mutedForeground)
                Text("$muertes12m", fontSize = 20.sp, fontWeight = FontWeight.Black, color = AppColors.foreground)
            }
            AppCard(modifier = Modifier.weight(1f)) {
                Text("TASA", style = MaterialTheme.typography.labelSmall, color = AppColors.mutedForeground)
                Text("${numero(tasa)}%", fontSize = 20.sp, fontWeight = FontWeight.Black, color = AppColors.foreground)
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            AppCard(modifier = Modifier.weight(1f)) {
                Text("CAUSA PRINCIPAL", style = MaterialTheme.typography.labelSmall, color = AppColors.mutedForeground)
                Text(
                    causaPrincipal,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Black,
                    color = AppColors.foreground,
                    maxLines = 1,
                )
            }
            AppCard(modifier = Modifier.weight(1f)) {
                Text("VS 12M PREVIOS", style = MaterialTheme.typography.labelSmall, color = AppColors.mutedForeground)
                Text(
                    (if (variacion > 0) "+" else "") + "$variacion%",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    color = when {
                        variacion > 0 -> AppColors.red400
                        variacion < 0 -> AppColors.emerald400
                        else -> AppColors.foreground
                    },
                )
            }
        }

        // ── Barras mensuales (becerros vs adultos) ──
        AppCard {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("MUERTES POR MES", style = MaterialTheme.typography.labelSmall, color = AppColors.mutedForeground)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    LeyendaPunto(AppColors.purple700, "Adultos")
                    LeyendaPunto(AppColors.purple400, "Becerros")
                }
            }
            Spacer(Modifier.height(10.dp))
            val porMes = meses12.map { clave ->
                val delMes = registros.filter { it.fecha.take(7) == clave }
                Triple(
                    clave.substring(5),
                    delMes.count { it.categoria != "becerro" },
                    delMes.count { it.categoria == "becerro" },
                )
            }
            val maxMes = porMes.maxOf { it.second + it.third }.coerceAtLeast(1)
            Row(
                modifier = Modifier.fillMaxWidth().height(90.dp),
                horizontalArrangement = Arrangement.spacedBy(3.dp),
                verticalAlignment = Alignment.Bottom,
            ) {
                porMes.forEach { (_, adultos, becerros) ->
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.Bottom,
                    ) {
                        if (becerros > 0) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height((80f * becerros / maxMes).dp)
                                    .background(AppColors.purple400, RoundedCornerShape(topStart = 2.dp, topEnd = 2.dp)),
                            )
                        }
                        if (adultos > 0) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height((80f * adultos / maxMes).dp)
                                    .background(AppColors.purple700),
                            )
                        }
                    }
                }
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                porMes.forEach { (etiqueta, _, _) ->
                    Text(
                        etiqueta,
                        fontSize = 8.sp,
                        color = AppColors.mutedForeground,
                        modifier = Modifier.weight(1f),
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    )
                }
            }
        }

        // ── Torta de causas ──
        AppCard {
            Text("CAUSAS DE MUERTE", style = MaterialTheme.typography.labelSmall, color = AppColors.mutedForeground)
            Spacer(Modifier.height(10.dp))
            if (causas.isEmpty()) {
                EstadoVacio("Sin registros de mortalidad.")
            } else {
                val totalCausas = causas.sumOf { it.value }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Canvas(modifier = Modifier.size(110.dp)) {
                        var inicio = -90f
                        causas.forEachIndexed { i, (_, count) ->
                            val barrido = 360f * count / totalCausas
                            drawArc(
                                color = PALETA[i % PALETA.size],
                                startAngle = inicio,
                                sweepAngle = barrido,
                                useCenter = true,
                            )
                            inicio += barrido
                        }
                    }
                    Column(modifier = Modifier.padding(start = 14.dp).weight(1f)) {
                        causas.forEachIndexed { i, (causa, count) ->
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(vertical = 2.dp),
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .background(PALETA[i % PALETA.size], RoundedCornerShape(2.dp)),
                                )
                                Text(
                                    causa,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = AppColors.foreground,
                                    modifier = Modifier.padding(start = 6.dp).weight(1f),
                                    maxLines = 1,
                                )
                                Text(
                                    "$count · ${count * 100 / totalCausas}%",
                                    fontSize = 10.sp,
                                    color = AppColors.mutedForeground,
                                )
                            }
                        }
                    }
                }
            }
        }

        // ── Registros ──
        AppCard {
            Text("REGISTROS", style = MaterialTheme.typography.labelSmall, color = AppColors.mutedForeground)
            Spacer(Modifier.height(6.dp))
            if (registros.isEmpty()) {
                EstadoVacio("No hay animales muertos registrados.")
            } else {
                registros.forEach { r ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Column {
                            Text(
                                r.codigo,
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Black,
                                color = AppColors.foreground,
                            )
                            Text(
                                "${r.fecha} · ${r.causa}",
                                style = MaterialTheme.typography.bodySmall,
                                color = AppColors.mutedForeground,
                            )
                        }
                        Badge(r.categoria, BadgeVariant.Gray)
                    }
                }
            }
        }
        Spacer(Modifier.height(10.dp))
    }
}

@Composable
private fun LeyendaPunto(color: Color, texto: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(8.dp).background(color, RoundedCornerShape(2.dp)))
        Text(
            texto,
            fontSize = 9.sp,
            color = AppColors.mutedForeground,
            modifier = Modifier.padding(start = 3.dp),
        )
    }
}
