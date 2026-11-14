package tech.jacobdavis.aegisdawn.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import tech.jacobdavis.aegisdawn.model.SessionState
import tech.jacobdavis.aegisdawn.model.ViewMode
import tech.jacobdavis.aegisdawn.ui.theme.CrtAlert
import tech.jacobdavis.aegisdawn.ui.theme.CrtAmber
import tech.jacobdavis.aegisdawn.ui.theme.CrtPhosphor
import tech.jacobdavis.aegisdawn.ui.theme.CrtPhosphorDim
import tech.jacobdavis.aegisdawn.ui.theme.CrtSurface
import tech.jacobdavis.aegisdawn.ui.theme.CrtTextDim
import tech.jacobdavis.aegisdawn.ui.theme.CrtVoid
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun TacticalViewport(
    session: SessionState,
    onSelectViewMode: (ViewMode) -> Unit,
    onMoveGroundToken: (tokenId: String, nodeId: String) -> Unit,
    modifier: Modifier = Modifier
) {
    val activeAccent = if (session.meta.hostileContact) CrtAlert else CrtPhosphor

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(CrtSurface)
            .border(1.dp, activeAccent.copy(alpha = 0.7f), RoundedCornerShape(2.dp))
            .padding(10.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "BRIDGE VIEWSCREEN MIRROR",
                    style = MaterialTheme.typography.titleMedium,
                    color = activeAccent
                )
                Text(
                    text = "SS AEGIS DAWN // ${session.tacticalMap.orbital.systemName.uppercase()}",
                    style = MaterialTheme.typography.labelSmall,
                    color = CrtTextDim
                )
            }
            if (session.meta.hostileContact) {
                CrtStatusBadge(text = "HOSTILE CONTACT", color = CrtAlert)
            } else {
                CrtStatusBadge(text = "CONDITION GREEN", color = CrtPhosphor)
            }
        }

        // View Mode Switcher
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            ViewMode.entries.forEach { mode ->
                val selected = session.meta.viewMode == mode
                CrtButton(
                    text = mode.label,
                    onClick = { onSelectViewMode(mode) },
                    accentColor = if (selected) activeAccent else CrtPhosphorDim,
                    filled = selected,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // Active Tactical Canvas + Telemetry
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .background(CrtVoid)
                .border(1.dp, CrtPhosphorDim)
                .padding(8.dp)
        ) {
            when (session.meta.viewMode) {
                ViewMode.ORBITAL_SCAN -> OrbitalScanViewport(session, activeAccent)
                ViewMode.SPACE_COMBAT -> SpaceCombatViewport(session, activeAccent)
                ViewMode.GROUND_ZONES -> GroundZonesViewport(session, onMoveGroundToken)
            }
        }

        // Bottom A.R.I.A. Ticker Mirror
        val latestAria = session.feed.firstOrNull { it.type == tech.jacobdavis.aegisdawn.model.FeedEntryType.ARIA }
        CrtTerminalBox(
            title = "A.R.I.A. VIEWSCREEN TICKER",
            borderColor = when {
                session.meta.ariaSleeperTriggered -> CrtAlert
                session.meta.ariaCorrupted -> CrtAmber
                else -> CrtPhosphorDim
            }
        ) {
            Text(
                text = latestAria?.body ?: "Awaiting orbital or sensor telemetry...",
                style = MaterialTheme.typography.bodyMedium,
                color = if (session.meta.ariaSleeperTriggered) CrtAlert else CrtPhosphor
            )
        }
    }
}

@Composable
private fun OrbitalScanViewport(session: SessionState, accent: Color) {
    val orbital = session.tacticalMap.orbital
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(170.dp),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = Offset(size.width * 0.5f, size.height * 0.52f)
                val radius = size.minDimension * 0.32f

                // Wireframe Planet
                drawCircle(
                    color = accent,
                    radius = radius,
                    center = center,
                    style = Stroke(width = 1.5.dp.toPx())
                )
                // Latitude rings
                drawOval(
                    color = accent.copy(alpha = 0.45f),
                    topLeft = Offset(center.x - radius, center.y - radius * 0.35f),
                    size = androidx.compose.ui.geometry.Size(radius * 2f, radius * 0.7f),
                    style = Stroke(width = 1.dp.toPx())
                )
                // Orbital trajectory
                drawOval(
                    color = CrtAmber.copy(alpha = 0.6f),
                    topLeft = Offset(center.x - radius * 1.65f, center.y - radius * 0.52f),
                    size = androidx.compose.ui.geometry.Size(radius * 3.3f, radius * 1.04f),
                    style = Stroke(width = 1.dp.toPx())
                )

                // SS Aegis Dawn wireframe silhouette on orbit
                val shipPos = Offset(center.x + radius * 1.35f, center.y - radius * 0.25f)
                val shipPath = Path().apply {
                    moveTo(shipPos.x + 12f, shipPos.y)
                    lineTo(shipPos.x - 10f, shipPos.y - 7f)
                    lineTo(shipPos.x - 5f, shipPos.y)
                    lineTo(shipPos.x - 10f, shipPos.y + 7f)
                    close()
                }
                drawPath(shipPath, color = CrtPhosphor, style = Stroke(width = 1.5.dp.toPx()))
            }

            Column(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(4.dp)
            ) {
                Text(
                    text = "SYS: ${orbital.systemName.uppercase()}",
                    style = MaterialTheme.typography.titleMedium,
                    color = accent
                )
                Text(
                    text = "UWP: ${orbital.uwp}",
                    style = MaterialTheme.typography.labelLarge,
                    color = CrtAmber
                )
            }
        }

        CrtTerminalBox(title = "CONTRADICTION HOOK", borderColor = CrtAmber) {
            Text(
                text = orbital.contradictionHook,
                style = MaterialTheme.typography.bodyLarge,
                color = CrtAmber
            )
        }

        CrtTerminalBox(title = "SENSOR ANOMALIES") {
            if (orbital.anomalies.isEmpty()) {
                Text("No active anomalies flagged.", style = MaterialTheme.typography.bodyMedium)
            } else {
                orbital.anomalies.forEach { anomaly ->
                    Text("• $anomaly", style = MaterialTheme.typography.bodyMedium, color = CrtPhosphor)
                }
            }
        }
    }
}

@Composable
private fun SpaceCombatViewport(session: SessionState, accent: Color) {
    val contacts = session.tacticalMap.spaceRadar.contacts.values.toList()
    val lockedId = session.stations.gunner.lockedTargetId

    Column(modifier = Modifier.fillMaxSize()) {
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = Offset(size.width / 2f, size.height / 2f)
                val maxR = size.minDimension * 0.45f

                // Concentric Traveller Range Band rings
                val bands = 6
                for (i in 1..bands) {
                    val r = maxR * (i.toFloat() / bands.toFloat())
                    drawCircle(
                        color = accent.copy(alpha = if (i % 2 == 0) 0.45f else 0.25f),
                        radius = r,
                        center = center,
                        style = Stroke(width = 1.dp.toPx())
                    )
                }

                // Crosshairs
                drawLine(
                    color = accent.copy(alpha = 0.25f),
                    start = Offset(center.x - maxR, center.y),
                    end = Offset(center.x + maxR, center.y),
                    strokeWidth = 1.dp.toPx()
                )
                drawLine(
                    color = accent.copy(alpha = 0.25f),
                    start = Offset(center.x, center.y - maxR),
                    end = Offset(center.x, center.y + maxR),
                    strokeWidth = 1.dp.toPx()
                )

                // Aegis Dawn center icon
                val ship = Path().apply {
                    moveTo(center.x, center.y - 10f)
                    lineTo(center.x + 8f, center.y + 8f)
                    lineTo(center.x, center.y + 4f)
                    lineTo(center.x - 8f, center.y + 8f)
                    close()
                }
                drawPath(ship, color = CrtPhosphor, style = Stroke(width = 2.dp.toPx()))

                // Radar contacts
                contacts.forEach { contact ->
                    val rad = Math.toRadians(contact.bearingDeg.toDouble())
                    val dist = maxR * (contact.rangeBand.ringIndex.toFloat() / bands.toFloat())
                    val pos = Offset(
                        x = center.x + (cos(rad) * dist).toFloat(),
                        y = center.y + (sin(rad) * dist).toFloat()
                    )
                    val blipColor = if (contact.hostile || session.meta.hostileContact) CrtAlert else CrtAmber
                    drawCircle(color = blipColor, radius = 6.dp.toPx(), center = pos)
                    if (contact.id == lockedId) {
                        drawCircle(
                            color = CrtAlert,
                            radius = 12.dp.toPx(),
                            center = pos,
                            style = Stroke(width = 1.5.dp.toPx())
                        )
                    }
                }
            }
        }

        // Contact Legend
        contacts.forEach { contact ->
            val isLocked = contact.id == lockedId
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 2.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "${if (isLocked) "[LOCK] " else ""}${contact.name}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (isLocked) CrtAlert else CrtAmber
                )
                Text(
                    text = "${contact.rangeBand.label} // ${contact.transponder}",
                    style = MaterialTheme.typography.labelSmall,
                    color = CrtTextDim
                )
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun GroundZonesViewport(
    session: SessionState,
    onMoveGroundToken: (tokenId: String, nodeId: String) -> Unit
) {
    val nodes = session.tacticalMap.groundZones.nodes
    val tokens = session.tacticalMap.groundZones.tokens
    var selectedTokenId by remember { mutableStateOf(tokens.keys.firstOrNull()) }

    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                // Draw edges between connected nodes
                nodes.values.forEach { node ->
                    val start = Offset(node.xNorm * size.width, node.yNorm * size.height)
                    node.connectedTo.forEach { targetId ->
                        val target = nodes[targetId] ?: return@forEach
                        val end = Offset(target.xNorm * size.width, target.yNorm * size.height)
                        drawLine(
                            color = CrtPhosphorDim,
                            start = start,
                            end = end,
                            strokeWidth = 2.dp.toPx()
                        )
                    }
                }

                // Draw zone nodes
                nodes.values.forEach { node ->
                    val pos = Offset(node.xNorm * size.width, node.yNorm * size.height)
                    drawCircle(color = CrtVoid, radius = 16.dp.toPx(), center = pos)
                    drawCircle(
                        color = CrtPhosphor,
                        radius = 16.dp.toPx(),
                        center = pos,
                        style = Stroke(width = 1.5.dp.toPx())
                    )
                }

                // Draw tokens grouped near their node
                tokens.values.groupBy { it.nodeId }.forEach { (nodeId, nodeTokens) ->
                    val node = nodes[nodeId] ?: return@forEach
                    val base = Offset(node.xNorm * size.width, node.yNorm * size.height)
                    nodeTokens.forEachIndexed { idx, token ->
                        val offset = Offset(base.x + (idx - 0.5f) * 18f, base.y + 22.dp.toPx())
                        val color = when {
                            token.id == selectedTokenId -> CrtAmber
                            token.isHostile -> CrtAlert
                            else -> CrtPhosphor
                        }
                        drawCircle(color = color, radius = 6.dp.toPx(), center = offset)
                    }
                }
            }
        }

        // Token & Zone Move Controls
        Text(
            text = "TAP TOKEN -> TAP DESTINATION ZONE",
            style = MaterialTheme.typography.labelSmall,
            color = CrtTextDim
        )
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            tokens.values.forEach { token ->
                val selected = token.id == selectedTokenId
                val nodeName = nodes[token.nodeId]?.label ?: token.nodeId
                CrtButton(
                    text = "${token.label} @ $nodeName",
                    onClick = { selectedTokenId = token.id },
                    accentColor = if (token.isHostile) CrtAlert else if (selected) CrtAmber else CrtPhosphor,
                    filled = selected
                )
            }
        }
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            nodes.values.forEach { node ->
                CrtButton(
                    text = "MOVE -> ${node.label}",
                    onClick = {
                        selectedTokenId?.let { tid -> onMoveGroundToken(tid, node.id) }
                    },
                    accentColor = CrtPhosphor
                )
            }
        }
    }
}
