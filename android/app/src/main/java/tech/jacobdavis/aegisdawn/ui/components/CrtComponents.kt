package tech.jacobdavis.aegisdawn.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.jacobdavis.aegisdawn.ui.theme.CrtAmber
import tech.jacobdavis.aegisdawn.ui.theme.CrtPhosphor
import tech.jacobdavis.aegisdawn.ui.theme.CrtPhosphorDim
import tech.jacobdavis.aegisdawn.ui.theme.CrtSurface
import tech.jacobdavis.aegisdawn.ui.theme.CrtSurfaceElevated
import tech.jacobdavis.aegisdawn.ui.theme.CrtTextDim
import tech.jacobdavis.aegisdawn.ui.theme.CrtVoid

@Composable
fun CrtScanlineOverlay(modifier: Modifier = Modifier) {
    Canvas(modifier = modifier.fillMaxSize()) {
        val stepPx = 4.dp.toPx()
        var y = 0f
        while (y < size.height) {
            drawLine(
                color = Color.Black.copy(alpha = 0.22f),
                start = Offset(0f, y),
                end = Offset(size.width, y),
                strokeWidth = 1.dp.toPx()
            )
            y += stepPx
        }
    }
}

@Composable
fun CrtTerminalBox(
    modifier: Modifier = Modifier,
    title: String? = null,
    borderColor: Color = CrtPhosphorDim,
    backgroundColor: Color = CrtSurface,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = modifier
            .background(backgroundColor, RoundedCornerShape(2.dp))
            .border(1.dp, borderColor, RoundedCornerShape(2.dp))
            .padding(10.dp)
    ) {
        if (title != null) {
            Text(
                text = "[ $title ]",
                style = MaterialTheme.typography.labelLarge,
                color = borderColor.takeIf { it != CrtPhosphorDim } ?: CrtPhosphor
            )
            Spacer(modifier = Modifier.height(6.dp))
        }
        content()
    }
}

@Composable
fun CrtButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    accentColor: Color = CrtPhosphor,
    filled: Boolean = false,
    enabled: Boolean = true
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier,
        shape = RoundedCornerShape(2.dp),
        border = BorderStroke(
            width = 1.dp,
            color = if (enabled) accentColor else CrtPhosphorDim.copy(alpha = 0.4f)
        ),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = if (filled) accentColor.copy(alpha = 0.18f) else CrtSurfaceElevated,
            contentColor = accentColor,
            disabledContentColor = CrtPhosphorDim.copy(alpha = 0.5f)
        ),
        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelLarge.copy(fontSize = 11.sp),
            color = if (enabled) accentColor else CrtPhosphorDim.copy(alpha = 0.5f)
        )
    }
}

@Composable
fun CrtSegmentedBar(
    label: String,
    current: Int,
    max: Int,
    accentColor: Color = CrtPhosphor,
    modifier: Modifier = Modifier,
    onDecrement: (() -> Unit)? = null,
    onIncrement: (() -> Unit)? = null
) {
    val safeMax = max.coerceAtLeast(1)
    val ratio = (current.toFloat() / safeMax.toFloat()).coerceIn(0f, 1f)
    Column(modifier = modifier) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = CrtTextDim
            )
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (onDecrement != null) {
                    Text(
                        text = "[-]",
                        style = MaterialTheme.typography.labelLarge,
                        color = CrtAmber,
                        modifier = Modifier
                            .clickable(onClick = onDecrement)
                            .padding(horizontal = 4.dp)
                    )
                }
                Text(
                    text = "$current/$max",
                    style = MaterialTheme.typography.labelLarge,
                    color = accentColor
                )
                if (onIncrement != null) {
                    Text(
                        text = "[+]",
                        style = MaterialTheme.typography.labelLarge,
                        color = CrtPhosphor,
                        modifier = Modifier
                            .clickable(onClick = onIncrement)
                            .padding(horizontal = 4.dp)
                    )
                }
            }
        }
        Spacer(modifier = Modifier.height(3.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .background(CrtVoid)
                .border(1.dp, CrtPhosphorDim)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(ratio)
                    .height(8.dp)
                    .background(accentColor)
            )
        }
    }
}

@Composable
fun CrtStatusBadge(
    text: String,
    color: Color = CrtPhosphor,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .background(color.copy(alpha = 0.14f), RoundedCornerShape(2.dp))
            .border(1.dp, color, RoundedCornerShape(2.dp))
            .padding(horizontal = 6.dp, vertical = 2.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            color = color
        )
    }
}
