package com.ganadosmart.app.data

import com.russhwolf.settings.Settings
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

// Cola offline de acciones de campo (peso / mortalidad / movimiento) +
// caché de listas para poder operar sin señal en el potrero.
// ponytail: persistencia JSON en Settings — suficiente para el piloto;
// migrar a SQLDelight si la cola o el hato crecen de verdad.
object SyncStore {
    private val settings: Settings = Settings()
    private val json = Json { ignoreUnknownKeys = true; explicitNulls = false }

    // ── Cola de acciones ──

    var cola: List<AccionPendiente>
        get() = settings.getStringOrNull("cola_sync")?.let {
            runCatching { json.decodeFromString<List<AccionPendiente>>(it) }.getOrElse { emptyList() }
        } ?: emptyList()
        private set(value) = settings.putString("cola_sync", json.encodeToString(value))

    fun encolar(accion: AccionPendiente) {
        cola = cola + accion
    }

    fun limpiarResueltas(resueltas: List<AccionPendiente>) {
        cola = cola - resueltas.toSet()
    }

    fun descartar(accion: AccionPendiente) {
        cola = cola - accion
    }

    // Envía la cola completa como lote al backend. Las aplicadas salen de la
    // cola; conflicto/error quedan marcadas para que el usuario decida.
    suspend fun sincronizar(): String {
        val pendientes = cola.filter { it.estado == "pendiente" }
        if (pendientes.isEmpty()) return "Nada pendiente por sincronizar"

        val body = buildJsonObject {
            put("acciones", buildJsonArray {
                pendientes.forEach { a ->
                    add(buildJsonObject {
                        put("tipo", a.tipo)
                        put("timestampLocal", a.timestampLocal)
                        put("datos", datosDe(a))
                    })
                }
            })
        }

        val respuesta = Api.sincronizarLote(json.encodeToString(JsonObject.serializer(), body))

        // Los resultados vienen en el mismo orden del lote enviado.
        val resueltas = mutableListOf<AccionPendiente>()
        var conflictos = 0
        val actualizada = cola.toMutableList()
        respuesta.resultados.forEachIndexed { i, resultado ->
            val accion = pendientes.getOrNull(i) ?: return@forEachIndexed
            when (resultado.estado) {
                "aplicado" -> resueltas.add(accion)
                else -> {
                    conflictos++
                    val idx = actualizada.indexOf(accion)
                    if (idx >= 0) {
                        actualizada[idx] = accion.copy(
                            estado = resultado.estado,
                            detalle = resultado.mensaje,
                        )
                    }
                }
            }
        }
        cola = actualizada - resueltas.toSet()

        return if (conflictos == 0) {
            "${resueltas.size} acción(es) sincronizada(s)"
        } else {
            "${resueltas.size} aplicada(s), $conflictos con conflicto/error"
        }
    }

    private fun datosDe(a: AccionPendiente): JsonObject = buildJsonObject {
        a.datosPeso?.let { put("animalId", it.animalId); put("pesoKg", it.pesoKg); put("fecha", it.fecha) }
        a.datosMortalidad?.let { put("animalId", it.animalId); put("fecha", it.fecha); put("causa", it.causa) }
        a.datosMovimiento?.let {
            put("animalId", it.animalId)
            put("potreroOrigenId", it.potreroOrigenId)
            put("potreroDestinoId", it.potreroDestinoId)
            put("fecha", it.fecha)
        }
    }

    // ── Caché para trabajar sin señal (elegir animal/potrero en el campo) ──

    var animalesCache: List<AnimalItem>
        get() = settings.getStringOrNull("cache_animales")?.let {
            runCatching { json.decodeFromString<List<AnimalItem>>(it) }.getOrElse { emptyList() }
        } ?: emptyList()
        set(value) = settings.putString("cache_animales", json.encodeToString(value))

    var potrerosCache: List<Potrero>
        get() = settings.getStringOrNull("cache_potreros")?.let {
            runCatching { json.decodeFromString<List<Potrero>>(it) }.getOrElse { emptyList() }
        } ?: emptyList()
        set(value) = settings.putString("cache_potreros", json.encodeToString(value))
}
