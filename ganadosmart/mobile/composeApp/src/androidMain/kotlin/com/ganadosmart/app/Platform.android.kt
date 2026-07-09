package com.ganadosmart.app

import java.time.Instant
import java.time.LocalDate

actual fun hoyIso(): String = LocalDate.now().toString()

actual fun ahoraIso(): String = Instant.now().toString()
