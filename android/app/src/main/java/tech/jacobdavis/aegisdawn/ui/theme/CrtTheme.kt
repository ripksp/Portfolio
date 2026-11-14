package tech.jacobdavis.aegisdawn.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val CrtVoid = Color(0xFF0A0F0A)
val CrtSurface = Color(0xFF0F180F)
val CrtSurfaceElevated = Color(0xFF152415)
val CrtPhosphor = Color(0xFF33FF66)
val CrtPhosphorDim = Color(0xFF1D6B32)
val CrtTextDim = Color(0xFF7FD996)
val CrtAmber = Color(0xFFFFB000)
val CrtAlert = Color(0xFFFF3B30)

private val CrtDarkColorScheme = darkColorScheme(
    primary = CrtPhosphor,
    onPrimary = CrtVoid,
    primaryContainer = CrtSurfaceElevated,
    onPrimaryContainer = CrtPhosphor,
    secondary = CrtAmber,
    onSecondary = CrtVoid,
    secondaryContainer = Color(0xFF2B1E00),
    onSecondaryContainer = CrtAmber,
    tertiary = CrtTextDim,
    onTertiary = CrtVoid,
    background = CrtVoid,
    onBackground = CrtPhosphor,
    surface = CrtSurface,
    onSurface = CrtPhosphor,
    surfaceVariant = CrtSurfaceElevated,
    onSurfaceVariant = CrtTextDim,
    error = CrtAlert,
    onError = Color.White,
    outline = CrtPhosphorDim,
    outlineVariant = Color(0xFF143D1E)
)

val CrtTypography = Typography(
    headlineMedium = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Bold,
        fontSize = 20.sp,
        letterSpacing = 1.5.sp,
        color = CrtPhosphor
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Bold,
        fontSize = 16.sp,
        letterSpacing = 1.2.sp,
        color = CrtPhosphor
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        letterSpacing = 0.8.sp,
        color = CrtPhosphor
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Normal,
        fontSize = 13.sp,
        lineHeight = 18.sp,
        color = CrtPhosphor
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        color = CrtTextDim
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Bold,
        fontSize = 12.sp,
        letterSpacing = 1.sp,
        color = CrtPhosphor
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Medium,
        fontSize = 10.sp,
        letterSpacing = 0.8.sp,
        color = CrtTextDim
    )
)

@Composable
fun AegisCrtTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = CrtDarkColorScheme,
        typography = CrtTypography,
        content = content
    )
}
