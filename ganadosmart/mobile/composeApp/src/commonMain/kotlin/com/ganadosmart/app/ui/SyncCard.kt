package com.ganadosmart.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.ganadosmart.app.data.SyncStore
import com.ganadosmart.app.theme.AppColors
import com.ganadosmart.app.theme.AppIcons
import kotlinx.coroutines.launch

// Estado de la cola offline + botón de sincronizar (visible en "Más").
@Composable
fun SyncCard() {
    var version by remember { mutableIntStateOf(0) }
    val cola = remember(version) { SyncStore.cola }
    var mensaje by remember { mutableStateOf<String?>(null) }
    var sincronizando by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    AppCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(AppIcons.Sync, contentDescription = null, tint = AppColors.sky400, modifier = Modifier.size(20.dp))
            Column(modifier = Modifier.padding(start = 12.dp).weight(1f)) {
                Text("Sincronización", style = MaterialTheme.typography.titleMedium, color = AppColors.foreground)
                Text(
                    if (cola.isEmpty()) "Sin acciones pendientes"
                    else "${cola.size} acción(es) guardada(s) offline",
                    style = MaterialTheme.typography.bodySmall,
                    color = AppColors.mutedForeground,
                )
            }
        }

        if (cola.isNotEmpty()) {
            Spacer(Modifier.height(10.dp))
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                cola.forEach { accion ->
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(
                            accion.etiqueta,
                            style = MaterialTheme.typography.bodySmall,
                            color = AppColors.foreground,
                            modifier = Modifier.weight(1f),
                        )
                        Badge(
                            label = when (accion.estado) {
                                "pendiente" -> "Pendiente"
                                "conflicto" -> "Conflicto"
                                else -> "Error"
                            },
                            variant = when (accion.estado) {
                                "pendiente" -> BadgeVariant.Yellow
                                "conflicto" -> BadgeVariant.Orange
                                else -> BadgeVariant.Red
                            },
                        )
                    }
                    accion.detalle?.let {
                        Text(it, style = MaterialTheme.typography.bodySmall, color = AppColors.red400)
                    }
                }
            }
            Spacer(Modifier.height(10.dp))
            BotonPrimario(
                texto = if (sincronizando) "Sincronizando…" else "Sincronizar ahora",
                habilitado = !sincronizando && cola.any { it.estado == "pendiente" },
                color = AppColors.emerald600,
                onClick = {
                    sincronizando = true
                    mensaje = null
                    scope.launch {
                        mensaje = try {
                            SyncStore.sincronizar()
                        } catch (e: Exception) {
                            "No se pudo sincronizar: ${e.message}"
                        }
                        sincronizando = false
                        version++
                    }
                },
            )
        }

        mensaje?.let {
            Spacer(Modifier.height(6.dp))
            Text(it, style = MaterialTheme.typography.bodySmall, color = AppColors.emerald400)
        }
    }
}
