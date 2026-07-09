package com.ganadosmart.app.data

import com.russhwolf.settings.Settings
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.request.HttpRequestBuilder
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.parameter
import io.ktor.client.request.patch
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

// Misma URL de producción que el frontend web (api.config.ts).
const val BASE_URL = "https://farmtec.fly.dev/api/v1"

class ApiException(message: String, val statusCode: Int = 0) : Exception(message)

// Marca de "sin red" — dispara el encolado offline en las acciones de campo.
class SinConexionException : Exception("Sin conexión con el servidor")

@Serializable
private data class ErrorBody(val message: String? = null, val statusCode: Int? = null)

private val json = Json { ignoreUnknownKeys = true; explicitNulls = false }

// Sesión persistida: token JWT + usuario logueado.
object Session {
    private val settings: Settings = Settings()

    var token: String?
        get() = settings.getStringOrNull("token")
        set(value) = if (value == null) settings.remove("token") else settings.putString("token", value)

    var usuario: Usuario?
        get() = settings.getStringOrNull("usuario")?.let {
            runCatching { json.decodeFromString<Usuario>(it) }.getOrNull()
        }
        set(value) = if (value == null) {
            settings.remove("usuario")
        } else {
            settings.putString("usuario", json.encodeToString(Usuario.serializer(), value))
        }

    val rol: String get() = usuario?.rol ?: ""
    val esDueno: Boolean get() = rol == "dueno_finca"
    val esAdmin: Boolean get() = rol == "administrador_finca"
    val esFinanciero: Boolean get() = esDueno || esAdmin
    val esCampo: Boolean get() = esDueno || esAdmin || rol == "veterinario"

    fun cerrar() {
        token = null
        usuario = null
    }
}

object Api {
    private val client = HttpClient {
        install(ContentNegotiation) { json(json) }
        defaultRequest {
            header(HttpHeaders.Accept, ContentType.Application.Json)
        }
        expectSuccess = false
    }

    private fun HttpRequestBuilder.auth() {
        Session.token?.let { header(HttpHeaders.Authorization, "Bearer $it") }
    }

    // Envuelve toda llamada: errores de red → SinConexionException (para la
    // cola offline); HTTP no-2xx → ApiException con el message del backend.
    private suspend inline fun <reified T> ejecutar(bloque: () -> HttpResponse): T {
        val response = try {
            bloque()
        } catch (e: ApiException) {
            throw e
        } catch (e: Exception) {
            throw SinConexionException()
        }
        if (!response.status.isSuccess()) {
            val mensaje = runCatching {
                json.decodeFromString<ErrorBody>(response.bodyAsText()).message
            }.getOrNull()
            throw ApiException(mensaje ?: "Error ${response.status.value}", response.status.value)
        }
        return response.body()
    }

    // ── Auth ──
    suspend fun login(correo: String, contrasena: String): LoginResponse =
        ejecutar {
            client.post("$BASE_URL/auth/login") {
                contentType(ContentType.Application.Json)
                setBody(LoginRequest(correo, contrasena))
            }
        }

    // ── Animales ──
    suspend fun animales(
        estado: String? = null,
        buscar: String? = null,
        pagina: Int = 1,
        limite: Int = 20,
    ): Paginado<AnimalItem> = ejecutar {
        client.get("$BASE_URL/animales") {
            auth()
            estado?.let { parameter("estado", it) }
            buscar?.takeIf { it.isNotBlank() }?.let { parameter("buscar", it) }
            parameter("pagina", pagina)
            parameter("limite", limite)
        }
    }

    suspend fun animal(id: String): AnimalDetalle =
        ejecutar { client.get("$BASE_URL/animales/$id") { auth() } }

    suspend fun crearAnimal(dto: CrearAnimalRequest): AnimalDetalle = ejecutar {
        client.post("$BASE_URL/animales") {
            auth(); contentType(ContentType.Application.Json); setBody(dto)
        }
    }

    suspend fun registrarPeso(animalId: String, dto: RegistrarPesoRequest): HttpResponse = ejecutar {
        client.post("$BASE_URL/animales/$animalId/peso") {
            auth(); contentType(ContentType.Application.Json); setBody(dto)
        }
    }

    suspend fun registrarMortalidad(animalId: String, dto: RegistrarMortalidadRequest): HttpResponse = ejecutar {
        client.post("$BASE_URL/animales/$animalId/mortalidad") {
            auth(); contentType(ContentType.Application.Json); setBody(dto)
        }
    }

    suspend fun reactivarAnimal(animalId: String, motivo: String): HttpResponse = ejecutar {
        client.patch("$BASE_URL/animales/$animalId/reactivar") {
            auth(); contentType(ContentType.Application.Json); setBody(MotivoRequest(motivo))
        }
    }

    suspend fun solicitarReactivacion(animalId: String, motivo: String): HttpResponse = ejecutar {
        client.post("$BASE_URL/animales/$animalId/solicitar-reactivacion") {
            auth(); contentType(ContentType.Application.Json); setBody(MotivoRequest(motivo))
        }
    }

    suspend fun actualizarFoto(animalId: String, fotoUrl: String): HttpResponse = ejecutar {
        client.patch("$BASE_URL/animales/$animalId/foto") {
            auth(); contentType(ContentType.Application.Json); setBody(FotoUrlRequest(fotoUrl))
        }
    }

    // ── Reproducción ──
    suspend fun reproducciones(estado: String? = null, pagina: Int = 1, limite: Int = 20): Paginado<Reproduccion> =
        ejecutar {
            client.get("$BASE_URL/reproducciones") {
                auth()
                estado?.let { parameter("estado", it) }
                parameter("pagina", pagina); parameter("limite", limite)
            }
        }

    suspend fun crearReproduccion(dto: CrearReproduccionRequest): Reproduccion = ejecutar {
        client.post("$BASE_URL/reproducciones") {
            auth(); contentType(ContentType.Application.Json); setBody(dto)
        }
    }

    suspend fun confirmarParto(id: String, dto: ConfirmarPartoRequest): Reproduccion = ejecutar {
        client.patch("$BASE_URL/reproducciones/$id/confirmar-parto") {
            auth(); contentType(ContentType.Application.Json); setBody(dto)
        }
    }

    // ── Potreros ──
    suspend fun potreros(): List<Potrero> =
        ejecutar { client.get("$BASE_URL/potreros") { auth() } }

    suspend fun crearPotrero(dto: CrearPotreroRequest): Potrero = ejecutar {
        client.post("$BASE_URL/potreros") {
            auth(); contentType(ContentType.Application.Json); setBody(dto)
        }
    }

    suspend fun movimientos(pagina: Int = 1, limite: Int = 20): Paginado<Movimiento> = ejecutar {
        client.get("$BASE_URL/potreros/movimientos") {
            auth(); parameter("pagina", pagina); parameter("limite", limite)
        }
    }

    suspend fun crearMovimiento(dto: CrearMovimientoRequest): HttpResponse = ejecutar {
        client.post("$BASE_URL/potreros/movimientos") {
            auth(); contentType(ContentType.Application.Json); setBody(dto)
        }
    }

    // ── Ventas ──
    suspend fun ventas(estadoAprobacion: String? = null, pagina: Int = 1, limite: Int = 20): Paginado<Venta> =
        ejecutar {
            client.get("$BASE_URL/ventas") {
                auth()
                estadoAprobacion?.let { parameter("estadoAprobacion", it) }
                parameter("pagina", pagina); parameter("limite", limite)
            }
        }

    suspend fun crearVenta(dto: CrearVentaRequest): Venta = ejecutar {
        client.post("$BASE_URL/ventas") {
            auth(); contentType(ContentType.Application.Json); setBody(dto)
        }
    }

    suspend fun aprobarVenta(id: String): Venta =
        ejecutar { client.patch("$BASE_URL/ventas/$id/aprobar") { auth() } }

    suspend fun rechazarVenta(id: String, motivo: String?): Venta = ejecutar {
        client.patch("$BASE_URL/ventas/$id/rechazar") {
            auth(); contentType(ContentType.Application.Json); setBody(RechazarRequest(motivo))
        }
    }

    // ── Gastos ──
    suspend fun gastos(categoria: String? = null, pagina: Int = 1, limite: Int = 20): Paginado<Gasto> =
        ejecutar {
            client.get("$BASE_URL/gastos") {
                auth()
                categoria?.let { parameter("categoria", it) }
                parameter("pagina", pagina); parameter("limite", limite)
            }
        }

    suspend fun crearGasto(dto: CrearGastoRequest): Gasto = ejecutar {
        client.post("$BASE_URL/gastos") {
            auth(); contentType(ContentType.Application.Json); setBody(dto)
        }
    }

    suspend fun aprobarGasto(id: String): Gasto =
        ejecutar { client.patch("$BASE_URL/gastos/$id/aprobar") { auth() } }

    suspend fun rechazarGasto(id: String, motivo: String?): Gasto = ejecutar {
        client.patch("$BASE_URL/gastos/$id/rechazar") {
            auth(); contentType(ContentType.Application.Json); setBody(RechazarRequest(motivo))
        }
    }

    // ── Reportes ──
    suspend fun dashboard(): Dashboard =
        ejecutar { client.get("$BASE_URL/reportes/dashboard") { auth() } }

    suspend fun mortalidad(): List<MortalidadRegistro> =
        ejecutar { client.get("$BASE_URL/reportes/mortalidad") { auth() } }

    // ── Usuarios ──
    suspend fun usuarios(pagina: Int = 1, limite: Int = 50): Paginado<Usuario> = ejecutar {
        client.get("$BASE_URL/usuarios") {
            auth(); parameter("pagina", pagina); parameter("limite", limite)
        }
    }

    suspend fun crearUsuario(dto: CrearUsuarioRequest): Usuario = ejecutar {
        client.post("$BASE_URL/usuarios") {
            auth(); contentType(ContentType.Application.Json); setBody(dto)
        }
    }

    // ── Alertas ──
    suspend fun alertas(leida: Boolean? = null, pagina: Int = 1, limite: Int = 20): Paginado<Alerta> =
        ejecutar {
            client.get("$BASE_URL/alertas") {
                auth()
                leida?.let { parameter("leida", it) }
                parameter("pagina", pagina); parameter("limite", limite)
            }
        }

    suspend fun marcarLeida(id: String): HttpResponse =
        ejecutar { client.patch("$BASE_URL/alertas/$id/marcar-leida") { auth() } }

    // ── Sincronización (cola offline) ──
    suspend fun sincronizarLote(body: String): LoteSyncResponse = ejecutar {
        client.post("$BASE_URL/sincronizacion/lote") {
            auth(); contentType(ContentType.Application.Json); setBody(body)
        }
    }
}
