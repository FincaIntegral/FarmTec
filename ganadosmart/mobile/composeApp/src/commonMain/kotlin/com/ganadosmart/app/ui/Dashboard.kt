package com.ganadosmart.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ganadosmart.app.data.Api
import com.ganadosmart.app.data.Dashboard
import com.ganadosmart.app.theme.AppColors
import kotlin.math.roundToLong

// Formato moneda simple: $ 1.234.567 (separador de miles con punto, sin decimales)
fun moneda(valor: Double): String {
    val entero = valor.roundToLong().toString()
    val conPuntos = entero.reversed().chunked(3).joinToString(".").reversed()
    return "$ $conPuntos"
}

fun numero(valor: Double?, decimales: Int = 1): String =
    valor?.let {
        val factor = if (decimales == 0) 1.0 else 10.0 * decimales
        ((it * factor).roundToLong() / factor).toString()
    } ?: "—"

@Composable
private fun KpiCard(titulo: String, valor: String, modifier: Modifier = Modifier, color: Color = AppColors.foreground) {
    AppCard(modifier = modifier) {
        Text(
            titulo.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = AppColors.mutedForeground,
        )
        Text(
            valor,
            fontSize = 20.sp,
            fontWeight = FontWeight.Black,
            color = color,
        )
    }
}

@Composable
fun DashboardScreen() {
    var datos by remember { mutableStateOf<Dashboard?>(null) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            datos = Api.dashboard()
        } catch (e: Exception) {
            error = e.message ?: "No se pudo cargar el dashboard"
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Encabezado("Dashboard", "Resumen de la finca")

        error?.let { MensajeError(it) }
        val d = datos
        if (d == null && error == null) {
            Cargando()
            return@Column
        }
        if (d == null) return@Column

        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            KpiCard("Total animales", d.totalAnimales.toString(), Modifier.weight(1f))
            KpiCard("Muertos", d.animalesMuertos.toString(), Modifier.weight(1f), AppColors.red400)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            KpiCard("Vacas", d.vacas.toString(), Modifier.weight(1f))
            KpiCard("Toros", d.toros.toString(), Modifier.weight(1f))
            KpiCard("Becerros", d.becerros.toString(), Modifier.weight(1f))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            KpiCard("Peso promedio", "${numero(d.pesoPromedio)} kg", Modifier.weight(1f))
            KpiCard("Valor del hato", moneda(d.valorEstimadoHato), Modifier.weight(1f))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            KpiCard("Natalidad", "${numero(d.tasaNatalidad)}%", Modifier.weight(1f), AppColors.emerald400)
            KpiCard("Mortalidad", "${numero(d.tasaMortalidad)}%", Modifier.weight(1f), AppColors.red400)
        }

        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            KpiCard("Ingresos mes", moneda(d.ingresosMes), Modifier.weight(1f), AppColors.emerald400)
            KpiCard("Gastos mes", moneda(d.gastosMes), Modifier.weight(1f), AppColors.red400)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            KpiCard(
                "Balance del mes",
                moneda(d.balanceMes),
                Modifier.weight(1f),
                if (d.balanceMes >= 0) AppColors.emerald400 else AppColors.red400,
            )
            KpiCard("Pend. aprobación", d.pendientesAprobacion.toString(), Modifier.weight(1f), AppColors.yellow400)
        }

        AppCard {
            Text(
                "ACTIVIDAD RECIENTE (7 DÍAS)",
                style = MaterialTheme.typography.labelSmall,
                color = AppColors.mutedForeground,
                modifier = Modifier.padding(bottom = 6.dp),
            )
            FilaDato("Pesos registrados", d.actividadReciente.pesosUltimos7Dias.toString())
            FilaDato("En tratamiento", d.actividadReciente.cambiosEstadoSalud.toString())
            FilaDato("Inseminaciones", d.actividadReciente.inseminacionesRegistradas.toString())
            FilaDato("Próximos a parto (30 días)", d.actividadReciente.proximosAParto.toString())
        }

        AppCard {
            Text(
                "DISTRIBUCIÓN POR SEXO",
                style = MaterialTheme.typography.labelSmall,
                color = AppColors.mutedForeground,
                modifier = Modifier.padding(bottom = 6.dp),
            )
            FilaDato("Machos", d.distribucionPorSexo.machos.toString())
            FilaDato("Hembras", d.distribucionPorSexo.hembras.toString())
            FilaDato("% auto-aprobado", "${numero(d.porcentajeAutoAprobado)}%")
        }
    }
}
