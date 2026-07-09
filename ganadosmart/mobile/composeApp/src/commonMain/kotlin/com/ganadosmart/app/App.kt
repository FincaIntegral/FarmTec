package com.ganadosmart.app

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.ganadosmart.app.data.Session
import com.ganadosmart.app.theme.AppColors
import com.ganadosmart.app.theme.GanadoSmartTheme
import com.ganadosmart.app.ui.LoginScreen
import com.ganadosmart.app.ui.Shell

@Composable
fun App() {
    GanadoSmartTheme {
        var logueado by remember { mutableStateOf(Session.token != null) }

        Surface(modifier = Modifier.fillMaxSize().background(AppColors.background), color = AppColors.background) {
            if (logueado) {
                Shell(onLogout = {
                    Session.cerrar()
                    logueado = false
                })
            } else {
                LoginScreen(onLogin = { logueado = true })
            }
        }
    }
}
