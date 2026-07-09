package com.ganadosmart.app.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.PathBuilder
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.dp

// Íconos de trazo estilo Lucide (los de la web), dibujados a mano — el
// artefacto material-icons-extended dejó de publicarse para CMP moderno.
// 24x24, trazo 2, puntas redondeadas. El tinte lo aplica Icon().
private fun icono(nombre: String, builder: PathBuilder.() -> Unit): ImageVector =
    ImageVector.Builder(
        name = nombre,
        defaultWidth = 24.dp,
        defaultHeight = 24.dp,
        viewportWidth = 24f,
        viewportHeight = 24f,
    ).apply {
        path(
            fill = null,
            stroke = SolidColor(Color.White),
            strokeLineWidth = 2f,
            strokeLineCap = StrokeCap.Round,
            strokeLineJoin = StrokeJoin.Round,
            pathBuilder = builder,
        )
    }.build()

object AppIcons {
    // Grid 2x2 — dashboard
    val Dashboard: ImageVector by lazy {
        icono("dashboard") {
            moveTo(3f, 3f); horizontalLineTo(10f); verticalLineTo(10f); horizontalLineTo(3f); close()
            moveTo(14f, 3f); horizontalLineTo(21f); verticalLineTo(10f); horizontalLineTo(14f); close()
            moveTo(3f, 14f); horizontalLineTo(10f); verticalLineTo(21f); horizontalLineTo(3f); close()
            moveTo(14f, 14f); horizontalLineTo(21f); verticalLineTo(21f); horizontalLineTo(14f); close()
        }
    }

    // Etiqueta/caravana — animales
    val Tag: ImageVector by lazy {
        icono("tag") {
            moveTo(12f, 2f); lineTo(21f, 11f); lineTo(13f, 19f); lineTo(4f, 10f)
            verticalLineTo(2f); close()
            moveTo(8f, 6f); lineTo(8.01f, 6f)
        }
    }

    // Corazón — reproducción
    val Heart: ImageVector by lazy {
        icono("heart") {
            moveTo(12f, 20f)
            curveTo(12f, 20f, 3f, 14f, 3f, 8.5f)
            curveTo(3f, 5.5f, 5.5f, 3.5f, 8f, 3.5f)
            curveTo(9.8f, 3.5f, 11.3f, 4.6f, 12f, 6f)
            curveTo(12.7f, 4.6f, 14.2f, 3.5f, 16f, 3.5f)
            curveTo(18.5f, 3.5f, 21f, 5.5f, 21f, 8.5f)
            curveTo(21f, 14f, 12f, 20f, 12f, 20f)
            close()
        }
    }

    // Pin de mapa — potreros
    val MapPin: ImageVector by lazy {
        icono("map-pin") {
            moveTo(12f, 21f)
            curveTo(12f, 21f, 5f, 14.5f, 5f, 9.5f)
            curveTo(5f, 5.9f, 8.1f, 3f, 12f, 3f)
            curveTo(15.9f, 3f, 19f, 5.9f, 19f, 9.5f)
            curveTo(19f, 14.5f, 12f, 21f, 12f, 21f)
            close()
            moveTo(15f, 9.5f)
            curveTo(15f, 11.2f, 13.7f, 12.5f, 12f, 12.5f)
            curveTo(10.3f, 12.5f, 9f, 11.2f, 9f, 9.5f)
            curveTo(9f, 7.8f, 10.3f, 6.5f, 12f, 6.5f)
            curveTo(13.7f, 6.5f, 15f, 7.8f, 15f, 9.5f)
            close()
        }
    }

    // Carrito — ventas
    val Cart: ImageVector by lazy {
        icono("cart") {
            moveTo(3f, 4f); lineTo(5f, 4f); lineTo(7.5f, 15f); lineTo(19f, 15f); lineTo(21f, 7f); lineTo(6f, 7f)
            moveTo(9f, 19.5f); lineTo(9.01f, 19.5f)
            moveTo(17f, 19.5f); lineTo(17.01f, 19.5f)
        }
    }

    // Recibo — gastos
    val Receipt: ImageVector by lazy {
        icono("receipt") {
            moveTo(5f, 3f); lineTo(19f, 3f); verticalLineTo(21f)
            lineTo(16.5f, 19f); lineTo(14f, 21f); lineTo(12f, 19f); lineTo(10f, 21f); lineTo(7.5f, 19f); lineTo(5f, 21f)
            close()
            moveTo(9f, 8f); lineTo(15f, 8f)
            moveTo(9f, 12f); lineTo(15f, 12f)
        }
    }

    // Calavera — mortalidad
    val Skull: ImageVector by lazy {
        icono("skull") {
            moveTo(12f, 2.5f)
            curveTo(7f, 2.5f, 3.5f, 6f, 3.5f, 10.5f)
            curveTo(3.5f, 13f, 4.8f, 15f, 6.5f, 16.3f)
            lineTo(6.5f, 19f)
            curveTo(6.5f, 20.1f, 7.4f, 21f, 8.5f, 21f)
            lineTo(15.5f, 21f)
            curveTo(16.6f, 21f, 17.5f, 20.1f, 17.5f, 19f)
            lineTo(17.5f, 16.3f)
            curveTo(19.2f, 15f, 20.5f, 13f, 20.5f, 10.5f)
            curveTo(20.5f, 6f, 17f, 2.5f, 12f, 2.5f)
            close()
            moveTo(10.5f, 11.5f)
            curveTo(10.5f, 12.6f, 9.6f, 13.5f, 8.75f, 13.5f)
            curveTo(7.9f, 13.5f, 7f, 12.6f, 7f, 11.5f)
            curveTo(7f, 10.4f, 7.9f, 9.5f, 8.75f, 9.5f)
            curveTo(9.6f, 9.5f, 10.5f, 10.4f, 10.5f, 11.5f)
            close()
            moveTo(17f, 11.5f)
            curveTo(17f, 12.6f, 16.1f, 13.5f, 15.25f, 13.5f)
            curveTo(14.4f, 13.5f, 13.5f, 12.6f, 13.5f, 11.5f)
            curveTo(13.5f, 10.4f, 14.4f, 9.5f, 15.25f, 9.5f)
            curveTo(16.1f, 9.5f, 17f, 10.4f, 17f, 11.5f)
            close()
            moveTo(12f, 16f); lineTo(12f, 17.5f)
        }
    }

    // Personas — usuarios
    val Users: ImageVector by lazy {
        icono("users") {
            moveTo(12f, 11f)
            curveTo(9.8f, 11f, 8f, 9.2f, 8f, 7f)
            curveTo(8f, 4.8f, 9.8f, 3f, 12f, 3f)
            curveTo(14.2f, 3f, 16f, 4.8f, 16f, 7f)
            curveTo(16f, 9.2f, 14.2f, 11f, 12f, 11f)
            close()
            moveTo(4f, 21f)
            curveTo(4f, 17f, 7.5f, 14.5f, 12f, 14.5f)
            curveTo(16.5f, 14.5f, 20f, 17f, 20f, 21f)
        }
    }

    // Campana — alertas
    val Bell: ImageVector by lazy {
        icono("bell") {
            moveTo(6f, 9f)
            curveTo(6f, 5.7f, 8.7f, 3f, 12f, 3f)
            curveTo(15.3f, 3f, 18f, 5.7f, 18f, 9f)
            curveTo(18f, 13f, 19.5f, 15f, 20.5f, 16f)
            lineTo(3.5f, 16f)
            curveTo(4.5f, 15f, 6f, 13f, 6f, 9f)
            close()
            moveTo(10f, 19.5f)
            curveTo(10.4f, 20.4f, 11.1f, 21f, 12f, 21f)
            curveTo(12.9f, 21f, 13.6f, 20.4f, 14f, 19.5f)
        }
    }

    // Menú "más" (tres puntos)
    val More: ImageVector by lazy {
        icono("more") {
            moveTo(5f, 12f); lineTo(5.01f, 12f)
            moveTo(12f, 12f); lineTo(12.01f, 12f)
            moveTo(19f, 12f); lineTo(19.01f, 12f)
        }
    }

    val Plus: ImageVector by lazy {
        icono("plus") {
            moveTo(12f, 5f); lineTo(12f, 19f)
            moveTo(5f, 12f); lineTo(19f, 12f)
        }
    }

    val Close: ImageVector by lazy {
        icono("close") {
            moveTo(6f, 6f); lineTo(18f, 18f)
            moveTo(18f, 6f); lineTo(6f, 18f)
        }
    }

    val Back: ImageVector by lazy {
        icono("back") {
            moveTo(14f, 6f); lineTo(8f, 12f); lineTo(14f, 18f)
        }
    }

    val Logout: ImageVector by lazy {
        icono("logout") {
            moveTo(15f, 4f); lineTo(19f, 4f); lineTo(19f, 20f); lineTo(15f, 20f)
            moveTo(10f, 8f); lineTo(6f, 12f); lineTo(10f, 16f)
            moveTo(6f, 12f); lineTo(15f, 12f)
        }
    }

    // Flechas circulares — sincronizar
    val Sync: ImageVector by lazy {
        icono("sync") {
            moveTo(20f, 5f); lineTo(20f, 10f); lineTo(15f, 10f)
            moveTo(4f, 19f); lineTo(4f, 14f); lineTo(9f, 14f)
            moveTo(20f, 10f)
            curveTo(19f, 6.5f, 15.8f, 4f, 12f, 4f)
            curveTo(8.9f, 4f, 6.2f, 5.7f, 5f, 8.3f)
            moveTo(4f, 14f)
            curveTo(5f, 17.5f, 8.2f, 20f, 12f, 20f)
            curveTo(15.1f, 20f, 17.8f, 18.3f, 19f, 15.7f)
        }
    }

    val Check: ImageVector by lazy {
        icono("check") {
            moveTo(5f, 12.5f); lineTo(10f, 17.5f); lineTo(19f, 7f)
        }
    }
}
