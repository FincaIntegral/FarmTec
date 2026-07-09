package com.ganadosmart.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ganadosmart.app.theme.AppColors

// ── Card con borde — réplica de app-card de la web ──

@Composable
fun AppCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(AppColors.card, RoundedCornerShape(12.dp))
            .border(1.dp, AppColors.border, RoundedCornerShape(12.dp))
            .padding(16.dp),
        content = content,
    )
}

// ── Badge de colores — mismas variantes que la web ──

enum class BadgeVariant { Green, Red, Yellow, Sky, Purple, Gray, Blue, Amber, Orange }

private data class BadgeColors(val bg: Color, val fg: Color, val border: Color)

private fun coloresDe(v: BadgeVariant): BadgeColors = when (v) {
    BadgeVariant.Green -> BadgeColors(Color(0x7F064E3B), AppColors.emerald400, Color(0x7F065F46))
    BadgeVariant.Red -> BadgeColors(Color(0x7F7F1D1D), AppColors.red400, Color(0x7F991B1B))
    BadgeVariant.Yellow -> BadgeColors(Color(0x7F713F12), AppColors.yellow400, Color(0x7F854D0E))
    BadgeVariant.Sky -> BadgeColors(Color(0x7F0C4A6E), AppColors.sky400, Color(0x7F075985))
    BadgeVariant.Purple -> BadgeColors(Color(0x7F581C87), AppColors.purple400, Color(0x7F6B21A8))
    BadgeVariant.Gray -> BadgeColors(Color(0x99374151), AppColors.gray400, Color(0x7F4B5563))
    BadgeVariant.Blue -> BadgeColors(Color(0x7F1E3A8A), AppColors.blue400, Color(0x7F1E40AF))
    BadgeVariant.Amber -> BadgeColors(Color(0x7F78350F), AppColors.amber400, Color(0x7F92400E))
    BadgeVariant.Orange -> BadgeColors(Color(0x7F7C2D12), AppColors.orange400, Color(0x7F9A3412))
}

@Composable
fun Badge(label: String, variant: BadgeVariant) {
    val c = coloresDe(variant)
    Text(
        text = label,
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold,
        color = c.fg,
        modifier = Modifier
            .background(c.bg, RoundedCornerShape(6.dp))
            .border(1.dp, c.border, RoundedCornerShape(6.dp))
            .padding(horizontal = 7.dp, vertical = 2.dp),
    )
}

// Mapeos compartidos entre pantallas (mismos de la web)
fun estadoAprobacionVariant(estado: String): BadgeVariant = when (estado) {
    "aprobado" -> BadgeVariant.Green
    "rechazado" -> BadgeVariant.Red
    else -> BadgeVariant.Yellow
}

fun estadoAprobacionLabel(estado: String): String = when (estado) {
    "aprobado" -> "Aprobado"
    "rechazado" -> "Rechazado"
    else -> "Pendiente"
}

fun estadoAnimalVariant(estado: String): BadgeVariant = when (estado) {
    "activo" -> BadgeVariant.Green
    "en_tratamiento" -> BadgeVariant.Yellow
    "vendido" -> BadgeVariant.Sky
    else -> BadgeVariant.Gray
}

fun estadoAnimalLabel(estado: String): String = when (estado) {
    "activo" -> "Activo"
    "en_tratamiento" -> "En tratamiento"
    "vendido" -> "Vendido"
    "muerto" -> "Muerto"
    else -> estado
}

fun rolVariant(rol: String): BadgeVariant = when (rol) {
    "dueno_finca" -> BadgeVariant.Green
    "administrador_finca" -> BadgeVariant.Blue
    "veterinario" -> BadgeVariant.Purple
    else -> BadgeVariant.Gray
}

fun rolLabel(rol: String): String = when (rol) {
    "dueno_finca" -> "Dueño"
    "administrador_finca" -> "Administrador"
    "veterinario" -> "Veterinario"
    "usuario_consulta" -> "Consulta"
    else -> rol
}

// ── Chips de filtro (como los de ventas/gastos web) ──

@Composable
fun FilterChips(
    opciones: List<Pair<String, String>>, // valor → etiqueta
    seleccionado: String,
    onSeleccion: (String) -> Unit,
) {
    Row(
        modifier = Modifier.horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        opciones.forEach { (valor, etiqueta) ->
            val activo = valor == seleccionado
            Text(
                text = etiqueta,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = if (activo) Color.White else AppColors.mutedForeground,
                modifier = Modifier
                    .background(
                        if (activo) AppColors.amber600 else AppColors.muted,
                        RoundedCornerShape(8.dp),
                    )
                    .border(
                        1.dp,
                        if (activo) AppColors.amber600 else AppColors.border,
                        RoundedCornerShape(8.dp),
                    )
                    .clickable { onSeleccion(valor) }
                    .padding(horizontal = 12.dp, vertical = 6.dp),
            )
        }
    }
}

// ── Inputs ──

@Composable
fun CampoTexto(
    valor: String,
    onCambio: (String) -> Unit,
    etiqueta: String,
    modifier: Modifier = Modifier,
    esPassword: Boolean = false,
    teclado: androidx.compose.foundation.text.KeyboardOptions =
        androidx.compose.foundation.text.KeyboardOptions.Default,
) {
    Column(modifier = modifier) {
        EtiquetaCampo(etiqueta)
        OutlinedTextField(
            value = valor,
            onValueChange = onCambio,
            singleLine = true,
            visualTransformation = if (esPassword) {
                androidx.compose.ui.text.input.PasswordVisualTransformation()
            } else {
                androidx.compose.ui.text.input.VisualTransformation.None
            },
            keyboardOptions = teclado,
            textStyle = MaterialTheme.typography.bodyMedium,
            colors = camposColores(),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
fun EtiquetaCampo(texto: String) {
    Text(
        text = texto.uppercase(),
        fontSize = 9.sp,
        fontWeight = FontWeight.Black,
        letterSpacing = 0.8.sp,
        color = AppColors.mutedForeground,
        modifier = Modifier.padding(bottom = 4.dp),
    )
}

@Composable
private fun camposColores() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = AppColors.amber500.copy(alpha = 0.6f),
    unfocusedBorderColor = AppColors.border,
    focusedContainerColor = AppColors.muted,
    unfocusedContainerColor = AppColors.muted,
    focusedTextColor = AppColors.foreground,
    unfocusedTextColor = AppColors.foreground,
    cursorColor = AppColors.amber500,
)

// ── Selector desplegable simple ──

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Selector(
    etiqueta: String,
    opciones: List<Pair<String, String>>, // valor → etiqueta visible
    seleccionado: String,
    onSeleccion: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var abierto by remember { mutableStateOf(false) }
    val etiquetaActual = opciones.firstOrNull { it.first == seleccionado }?.second ?: ""

    Column(modifier = modifier) {
        EtiquetaCampo(etiqueta)
        ExposedDropdownMenuBox(expanded = abierto, onExpandedChange = { abierto = it }) {
            OutlinedTextField(
                value = etiquetaActual,
                onValueChange = {},
                readOnly = true,
                singleLine = true,
                textStyle = MaterialTheme.typography.bodyMedium,
                colors = camposColores(),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth().menuAnchor(),
            )
            ExposedDropdownMenu(expanded = abierto, onDismissRequest = { abierto = false }) {
                opciones.forEach { (valor, texto) ->
                    DropdownMenuItem(
                        text = { Text(texto, style = MaterialTheme.typography.bodyMedium) },
                        onClick = {
                            onSeleccion(valor)
                            abierto = false
                        },
                    )
                }
            }
        }
    }
}

// ── Botones ──

@Composable
fun BotonPrimario(
    texto: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    habilitado: Boolean = true,
    color: Color = AppColors.amber600,
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(
                if (habilitado) color else color.copy(alpha = 0.5f),
                RoundedCornerShape(8.dp),
            )
            .clickable(enabled = habilitado) { onClick() }
            .padding(vertical = 12.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            texto,
            color = Color.White,
            fontSize = 13.sp,
            fontWeight = FontWeight.Black,
        )
    }
}

// ── Modal (diálogo con el estilo de los modales web) ──

@Composable
fun Modal(
    titulo: String,
    onCerrar: () -> Unit,
    content: @Composable ColumnScope.() -> Unit,
) {
    AlertDialog(
        onDismissRequest = onCerrar,
        confirmButton = {},
        containerColor = AppColors.card,
        shape = RoundedCornerShape(14.dp),
        title = {
            Text(
                titulo,
                style = MaterialTheme.typography.titleMedium,
                color = AppColors.foreground,
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp), content = content)
        },
    )
}

// ── Estados de pantalla ──

@Composable
fun Cargando(texto: String = "Cargando…") {
    Column(
        modifier = Modifier.fillMaxWidth().padding(vertical = 40.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        CircularProgressIndicator(color = AppColors.amber500, modifier = Modifier.size(28.dp))
        Spacer(Modifier.height(10.dp))
        Text(texto, style = MaterialTheme.typography.bodySmall, color = AppColors.mutedForeground)
    }
}

@Composable
fun EstadoVacio(texto: String) {
    Text(
        texto,
        style = MaterialTheme.typography.bodySmall,
        color = AppColors.mutedForeground,
        textAlign = TextAlign.Center,
        modifier = Modifier.fillMaxWidth().padding(vertical = 40.dp),
    )
}

@Composable
fun MensajeError(texto: String) {
    Text(
        texto,
        style = MaterialTheme.typography.bodySmall,
        fontWeight = FontWeight.Bold,
        color = AppColors.red400,
        modifier = Modifier.padding(vertical = 4.dp),
    )
}

// ── Paginación "cargar más" ──

@Composable
fun CargarMas(hayMas: Boolean, cargando: Boolean, onCargar: () -> Unit) {
    if (!hayMas) return
    Row(
        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
        horizontalArrangement = Arrangement.Center,
    ) {
        TextButton(onClick = onCargar, enabled = !cargando) {
            Text(
                if (cargando) "Cargando…" else "Cargar más",
                color = AppColors.amber400,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
            )
        }
    }
}

// ── Fila de dato clave-valor (fichas de detalle) ──

@Composable
fun FilaDato(clave: String, valor: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(clave, style = MaterialTheme.typography.bodySmall, color = AppColors.mutedForeground)
        Text(
            valor,
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Bold,
            color = AppColors.foreground,
            textAlign = TextAlign.End,
            modifier = Modifier.width(200.dp),
        )
    }
}

// Avatar circular con iniciales (usuarios / topbar)
@Composable
fun AvatarIniciales(nombre: String, size: Int = 32) {
    val iniciales = nombre.trim().split(Regex("\\s+"))
        .filter { it.isNotBlank() }
        .let { partes ->
            when {
                partes.isEmpty() -> ""
                partes.size == 1 -> partes[0].take(2).uppercase()
                else -> (partes[0].take(1) + partes[1].take(1)).uppercase()
            }
        }
    Box(
        modifier = Modifier
            .size(size.dp)
            .background(AppColors.muted, CircleShape)
            .border(1.dp, AppColors.border, CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            iniciales,
            fontSize = (size / 3).sp,
            fontWeight = FontWeight.Black,
            color = AppColors.foreground,
        )
    }
}
