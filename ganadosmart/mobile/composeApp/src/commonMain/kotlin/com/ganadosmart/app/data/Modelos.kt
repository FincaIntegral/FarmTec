package com.ganadosmart.app.data

import kotlinx.serialization.Serializable

// Espejo de las respuestas reales del backend (contrato-api-v2 + DTOs NestJS).
// Enums como String — el cliente no debe romperse si el backend agrega valores.

// ── Auth / Usuario ──

@Serializable
data class LoginRequest(val correo: String, val contrasena: String)

@Serializable
data class LoginResponse(val accessToken: String, val usuario: Usuario)

@Serializable
data class Usuario(
    val id: String,
    val fincaId: String,
    val nombre: String,
    val correo: String,
    val rol: String,
    val activo: Boolean,
    val ultimoAcceso: String? = null,
    val createdAt: String? = null,
)

@Serializable
data class CrearUsuarioRequest(
    val nombre: String,
    val correo: String,
    val contrasena: String,
    val rol: String,
)

// ── Paginación ──

@Serializable
data class PaginacionMeta(
    val paginaActual: Int,
    val totalPaginas: Int,
    val totalRegistros: Int,
    val limite: Int,
)

@Serializable
data class Paginado<T>(val datos: List<T>, val meta: PaginacionMeta)

// ── Animal ──

@Serializable
data class AnimalItem(
    val id: String,
    val codigo: String,
    val categoria: String,
    val sexo: String,
    val estado: String,
    val raza: String? = null,
    val pesoActual: Double? = null,
    val potreroActualId: String? = null,
    val enGestacion: Boolean = false,
)

@Serializable
data class PesoHistorial(val pesoKg: Double, val fecha: String)

@Serializable
data class ConteoReproduccion(val inseminaciones: Int = 0, val servicios: Int = 0)

@Serializable
data class AnimalDetalle(
    val id: String,
    val codigo: String,
    val categoria: String,
    val sexo: String,
    val estado: String,
    val raza: String? = null,
    val pesoActual: Double? = null,
    val potreroActualId: String? = null,
    val enGestacion: Boolean = false,
    val madreId: String? = null,
    val padreId: String? = null,
    val fechaNacimiento: String? = null,
    val valorComercialEstimado: Double? = null,
    val valorComercialAjustado: Double? = null,
    val fotoUrl: String? = null,
    val createdAt: String? = null,
    val historialPeso: List<PesoHistorial> = emptyList(),
    val conteoReproduccion: ConteoReproduccion = ConteoReproduccion(),
)

@Serializable
data class CrearAnimalRequest(
    val codigo: String,
    val categoria: String,
    val sexo: String,
    val fechaNacimiento: String? = null,
    val raza: String? = null,
    val madreId: String? = null,
    val padreId: String? = null,
)

@Serializable
data class RegistrarPesoRequest(val pesoKg: Double, val fecha: String)

@Serializable
data class RegistrarMortalidadRequest(val fecha: String, val causa: String)

@Serializable
data class MotivoRequest(val motivo: String)

@Serializable
data class FotoUrlRequest(val fotoUrl: String)

// ── Reproducción ──

@Serializable
data class Reproduccion(
    val id: String,
    val fincaId: String,
    val toroId: String? = null,
    val pajillaProveedor: String? = null,
    val pajillaRaza: String? = null,
    val vacaId: String,
    val tipo: String,
    val fecha: String,
    val fechaProbableParto: String? = null,
    val estado: String,
    val becerroResultanteId: String? = null,
    val createdAt: String? = null,
)

@Serializable
data class CrearReproduccionRequest(
    val vacaId: String,
    val tipo: String,
    val fecha: String,
    val toroId: String? = null,
    val pajillaProveedor: String? = null,
    val pajillaRaza: String? = null,
)

@Serializable
data class BecerroRequest(
    val sexo: String,
    val codigo: String,
    val pesoNacimiento: Double? = null,
    val fechaNacimiento: String? = null,
)

@Serializable
data class ConfirmarPartoRequest(val resultado: String, val becerro: BecerroRequest? = null)

// ── Potrero / Movimiento ──

@Serializable
data class Potrero(
    val id: String,
    val fincaId: String,
    val nombre: String,
    val hectareas: Double? = null,
    val tipoPasto: String? = null,
    val capacidadEstimada: Int? = null,
    val estado: String,
)

@Serializable
data class CrearPotreroRequest(
    val nombre: String,
    val hectareas: Double? = null,
    val tipoPasto: String? = null,
    val capacidadEstimada: Int? = null,
)

@Serializable
data class Movimiento(
    val id: String,
    val animalId: String,
    val potreroOrigenId: String,
    val potreroDestinoId: String,
    val fecha: String,
    val observacion: String? = null,
)

@Serializable
data class CrearMovimientoRequest(
    val animalId: String,
    val potreroOrigenId: String,
    val potreroDestinoId: String,
    val fecha: String,
    val observacion: String? = null,
)

// ── Venta / Gasto ──

@Serializable
data class Venta(
    val id: String,
    val fincaId: String,
    val animalId: String? = null,
    val comprador: String,
    val monto: Double,
    val fecha: String,
    val estadoAprobacion: String,
    val tipoAprobacion: String,
    val autoAprobado: Boolean,
    val creadoPor: String? = null,
    val aprobadoPor: String? = null,
    val motivoRechazo: String? = null,
    val createdAt: String? = null,
)

@Serializable
data class CrearVentaRequest(
    val comprador: String,
    val monto: Double,
    val fecha: String,
    val animalId: String? = null,
)

@Serializable
data class Gasto(
    val id: String,
    val fincaId: String,
    val categoria: String,
    val monto: Double,
    val descripcion: String? = null,
    val fecha: String,
    val estadoAprobacion: String,
    val tipoAprobacion: String,
    val autoAprobado: Boolean,
    val creadoPor: String? = null,
    val aprobadoPor: String? = null,
    val motivoRechazo: String? = null,
    val createdAt: String? = null,
)

@Serializable
data class CrearGastoRequest(
    val categoria: String,
    val monto: Double,
    val fecha: String,
    val descripcion: String? = null,
)

@Serializable
data class RechazarRequest(val motivo: String? = null)

// ── Reportes ──

@Serializable
data class ActividadReciente(
    val pesosUltimos7Dias: Int = 0,
    val cambiosEstadoSalud: Int = 0,
    val inseminacionesRegistradas: Int = 0,
    val proximosAParto: Int = 0,
)

@Serializable
data class DistribucionSexo(val machos: Int = 0, val hembras: Int = 0)

@Serializable
data class Dashboard(
    val totalAnimales: Int = 0,
    val animalesMuertos: Int = 0,
    val vacas: Int = 0,
    val toros: Int = 0,
    val becerros: Int = 0,
    val pesoPromedio: Double? = null,
    val tasaNatalidad: Double = 0.0,
    val tasaMortalidad: Double = 0.0,
    val ingresosMes: Double = 0.0,
    val gastosMes: Double = 0.0,
    val balanceMes: Double = 0.0,
    val valorEstimadoHato: Double = 0.0,
    val pendientesAprobacion: Int = 0,
    val porcentajeAutoAprobado: Double = 0.0,
    val actividadReciente: ActividadReciente = ActividadReciente(),
    val distribucionPorSexo: DistribucionSexo = DistribucionSexo(),
)

@Serializable
data class MortalidadRegistro(
    val animalId: String,
    val codigo: String,
    val categoria: String,
    val fecha: String,
    val causa: String,
)

// ── Alertas ──

@Serializable
data class Alerta(
    val id: String,
    val fincaId: String,
    val referenciaId: String,
    val tipoOrigen: String,
    val mensaje: String,
    val severidad: String,
    val leida: Boolean,
    val fecha: String,
)

// ── Sincronización offline ──

@Serializable
data class DatosPeso(val animalId: String, val pesoKg: Double, val fecha: String)

@Serializable
data class DatosMortalidad(val animalId: String, val fecha: String, val causa: String)

@Serializable
data class DatosMovimiento(
    val animalId: String,
    val potreroOrigenId: String,
    val potreroDestinoId: String,
    val fecha: String,
)

// Acción encolada localmente. `datos` viaja como JsonObject al backend;
// aquí guardamos los campos tipados + etiqueta legible para la UI.
@Serializable
data class AccionPendiente(
    val tipo: String, // registrar_peso | registrar_mortalidad | registrar_movimiento
    val timestampLocal: String,
    val etiqueta: String,
    val datosPeso: DatosPeso? = null,
    val datosMortalidad: DatosMortalidad? = null,
    val datosMovimiento: DatosMovimiento? = null,
    val estado: String = "pendiente", // pendiente | conflicto | error
    val detalle: String? = null,
)

@Serializable
data class ResultadoSync(
    val accionId: String? = null,
    val estado: String,
    val mensaje: String? = null,
)

@Serializable
data class LoteSyncResponse(val resultados: List<ResultadoSync>)
