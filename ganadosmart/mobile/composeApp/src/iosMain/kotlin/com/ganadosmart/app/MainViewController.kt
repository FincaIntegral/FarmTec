package com.ganadosmart.app

import androidx.compose.ui.window.ComposeUIViewController
import platform.UIKit.UIViewController

// Punto de entrada iOS — lo consume iosApp/iosApp/ContentView.swift.
fun MainViewController(): UIViewController = ComposeUIViewController { App() }
