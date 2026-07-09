package com.ganadosmart.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.ganadosmart.app.data.Api
import com.ganadosmart.app.data.ApiException
import com.ganadosmart.app.data.Session
import com.ganadosmart.app.theme.AppColors
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(onLogin: () -> Unit) {
    var correo by remember { mutableStateOf("") }
    var contrasena by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var cargando by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier.fillMaxSize().padding(horizontal = 28.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("GanadoSmart", style = MaterialTheme.typography.headlineSmall, color = AppColors.foreground)
        Text(
            "Gestión ganadera de la finca",
            style = MaterialTheme.typography.bodySmall,
            color = AppColors.mutedForeground,
        )
        Spacer(Modifier.height(28.dp))

        AppCard {
            CampoTexto(
                valor = correo,
                onCambio = { correo = it },
                etiqueta = "Correo",
                teclado = KeyboardOptions(keyboardType = KeyboardType.Email),
            )
            Spacer(Modifier.height(10.dp))
            CampoTexto(
                valor = contrasena,
                onCambio = { contrasena = it },
                etiqueta = "Contraseña",
                esPassword = true,
            )
            Spacer(Modifier.height(6.dp))
            error?.let { MensajeError(it) }
            Spacer(Modifier.height(10.dp))
            BotonPrimario(
                texto = if (cargando) "Ingresando…" else "Ingresar",
                habilitado = !cargando && correo.isNotBlank() && contrasena.isNotBlank(),
                onClick = {
                    cargando = true
                    error = null
                    scope.launch {
                        try {
                            val resp = Api.login(correo.trim(), contrasena)
                            Session.token = resp.accessToken
                            Session.usuario = resp.usuario
                            onLogin()
                        } catch (e: ApiException) {
                            error = e.message
                        } catch (e: Exception) {
                            error = "No se pudo conectar con el servidor"
                        } finally {
                            cargando = false
                        }
                    }
                },
            )
        }
    }
}
