package com.ganadosmart.app

// Fecha de hoy en ISO (YYYY-MM-DD), zona local del dispositivo.
expect fun hoyIso(): String

// Instante actual en ISO-8601 con zona (para timestampLocal de la cola offline).
expect fun ahoraIso(): String
