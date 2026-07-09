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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.ganadosmart.app.data.Api
import com.ganadosmart.app.data.CrearUsuarioRequest
import com.ganadosmart.app.data.Usuario
import com.ganadosmart.app.theme.AppColors
import com.ganadosmart.app.theme.AppIcons
import kotlinx.coroutines.launch

@Composable
fun UsuariosScreen(onVolver: () -> Unit) {
    var usuarios by remember { mutableStateOf<List<Usuario>>(emptyList()) }
    var cargando by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var recarga by remember { mutableIntStateOf(0) }
    var mostrarInvitar by remember { mutableStateOf(false) }

    LaunchedEffect(recarga) {
        cargando = true
        error = null
        try {
            usuarios = Api.usuarios(limite = 50).datos
        } catch (e: Exception) {
            error = e.message
        }
        cargando = false
    }

    Scaffold(
        containerColor = AppColors.background,
        floatingActionButton = {
            FloatingActionButton(
                onClick = { mostrarInvitar = true },
                containerColor = AppColors.emerald600,
                contentColor = Color.White,
            ) { Icon(AppIcons.Plus, contentDescription = "Invitar usuario") }
        },
    ) { _ ->
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Encabezado("Usuarios", "${usuarios.size} usuarios en la finca", onVolver = onVolver)
            error?.let { MensajeError(it) }

            if (cargando) {
                Cargando()
            } else if (usuarios.isEmpty()) {
                EstadoVacio("No hay usuarios registrados.")
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(usuarios, key = { it.id }) { u ->
                        AppCard {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                AvatarIniciales(u.nombre, size = 36)
                                Column(modifier = Modifier.padding(start = 10.dp).weight(1f)) {
                                    Text(
                                        u.nombre,
                                        style = MaterialTheme.typography.titleMedium,
                                        color = AppColors.foreground,
                                    )
                                    Text(
                                        u.correo,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = AppColors.mutedForeground,
                                    )
                                    Text(
                                        "Último acceso: ${u.ultimoAcceso?.take(10) ?: "Nunca"}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = AppColors.mutedForeground,
                                    )
                                }
                                Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Badge(rolLabel(u.rol), rolVariant(u.rol))
                                    Badge(
                                        if (u.activo) "Activo" else "Inactivo",
                                        if (u.activo) BadgeVariant.Green else BadgeVariant.Gray,
                                    )
                                }
                            }
                        }
                    }
                    item { Spacer(Modifier.height(70.dp)) }
                }
            }
        }
    }

    if (mostrarInvitar) {
        InvitarUsuarioModal(
            onCerrar = { mostrarInvitar = false },
            onCreado = { mostrarInvitar = false; recarga++ },
        )
    }
}

@Composable
private fun InvitarUsuarioModal(onCerrar: () -> Unit, onCreado: () -> Unit) {
    var nombre by remember { mutableStateOf("") }
    var correo by remember { mutableStateOf("") }
    var contrasena by remember { mutableStateOf("") }
    var rol by remember { mutableStateOf("veterinario") }
    var error by remember { mutableStateOf<String?>(null) }
    var guardando by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Modal("Invitar usuario", onCerrar) {
        CampoTexto(nombre, { nombre = it }, "Nombre *")
        CampoTexto(correo, { correo = it }, "Correo *")
        CampoTexto(contrasena, { contrasena = it }, "Contraseña (mín. 8) *", esPassword = true)
        Selector(
            "Rol *",
            listOf(
                "dueno_finca" to "Dueño",
                "administrador_finca" to "Administrador",
                "veterinario" to "Veterinario",
                "usuario_consulta" to "Consulta",
            ),
            rol,
            { rol = it },
        )
        error?.let { MensajeError(it) }
        BotonPrimario(
            texto = if (guardando) "Invitando…" else "Invitar usuario",
            color = AppColors.emerald600,
            habilitado = !guardando && nombre.isNotBlank() && correo.contains("@") && contrasena.length >= 8,
            onClick = {
                guardando = true
                error = null
                scope.launch {
                    try {
                        Api.crearUsuario(
                            CrearUsuarioRequest(
                                nombre = nombre.trim(),
                                correo = correo.trim(),
                                contrasena = contrasena,
                                rol = rol,
                            ),
                        )
                        onCreado()
                    } catch (e: Exception) {
                        error = e.message ?: "No se pudo invitar"
                    } finally {
                        guardando = false
                    }
                }
            },
        )
    }
}
