package com.ganadosmart.app.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Paleta del frontend web (Tailwind dark) — misma identidad visual.
object AppColors {
    val background = Color(0xFF09090B)      // zinc-950
    val card = Color(0xFF18181B)            // zinc-900
    val border = Color(0xFF27272A)          // zinc-800
    val muted = Color(0xFF1F1F23)
    val foreground = Color(0xFFFAFAFA)
    val mutedForeground = Color(0xFFA1A1AA) // zinc-400

    val amber600 = Color(0xFFD97706)        // botón primario web (bg-amber-600)
    val amber500 = Color(0xFFF59E0B)
    val amber400 = Color(0xFFFBBF24)

    val emerald600 = Color(0xFF059669)
    val emerald400 = Color(0xFF34D399)
    val red500 = Color(0xFFEF4444)
    val red400 = Color(0xFFF87171)
    val yellow400 = Color(0xFFFACC15)
    val sky400 = Color(0xFF38BDF8)
    val purple400 = Color(0xFFC084FC)
    val purple500 = Color(0xFFA855F7)
    val purple700 = Color(0xFF7E22CE)
    val blue400 = Color(0xFF60A5FA)
    val blue500 = Color(0xFF3B82F6)
    val gray400 = Color(0xFF9CA3AF)
    val orange400 = Color(0xFFFB923C)
}

private val esquemaOscuro = darkColorScheme(
    primary = AppColors.amber600,
    onPrimary = Color.White,
    background = AppColors.background,
    onBackground = AppColors.foreground,
    surface = AppColors.card,
    onSurface = AppColors.foreground,
    surfaceVariant = AppColors.muted,
    onSurfaceVariant = AppColors.mutedForeground,
    outline = AppColors.border,
    error = AppColors.red500,
)

// Réplica de la jerarquía web: headings font-black, cuerpos pequeños.
private val tipografia = Typography(
    headlineSmall = TextStyle(fontWeight = FontWeight.Black, fontSize = 20.sp),
    titleMedium = TextStyle(fontWeight = FontWeight.Black, fontSize = 15.sp),
    titleSmall = TextStyle(fontWeight = FontWeight.Black, fontSize = 12.sp, letterSpacing = 0.8.sp),
    bodyMedium = TextStyle(fontWeight = FontWeight.Medium, fontSize = 13.sp),
    bodySmall = TextStyle(fontWeight = FontWeight.Normal, fontSize = 12.sp),
    labelLarge = TextStyle(fontWeight = FontWeight.Black, fontSize = 13.sp),
    labelMedium = TextStyle(fontWeight = FontWeight.Bold, fontSize = 11.sp),
    labelSmall = TextStyle(fontWeight = FontWeight.Bold, fontSize = 9.sp, letterSpacing = 0.5.sp),
)

// ponytail: la web es dark-first; el tema claro queda para cuando alguien lo pida.
@Composable
fun GanadoSmartTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = esquemaOscuro,
        typography = tipografia,
        content = content,
    )
}
