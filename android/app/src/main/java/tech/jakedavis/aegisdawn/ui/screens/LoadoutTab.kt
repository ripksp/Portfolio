package tech.jakedavis.aegisdawn.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import tech.jakedavis.aegisdawn.data.CrewGearLoader
import tech.jakedavis.aegisdawn.data.GearCard
import tech.jakedavis.aegisdawn.model.SessionState
import tech.jakedavis.aegisdawn.model.StationRole
import tech.jakedavis.aegisdawn.ui.AegisViewModel
import tech.jakedavis.aegisdawn.ui.components.CrtButton
import tech.jakedavis.aegisdawn.ui.components.CrtSegmentedBar
import tech.jakedavis.aegisdawn.ui.components.CrtStatusBadge
import tech.jakedavis.aegisdawn.ui.components.CrtTerminalBox
import tech.jakedavis.aegisdawn.ui.theme.CrtAlert
import tech.jakedavis.aegisdawn.ui.theme.CrtAmber
import tech.jakedavis.aegisdawn.ui.theme.CrtPhosphor
import tech.jakedavis.aegisdawn.ui.theme.CrtPhosphorDim
import tech.jakedavis.aegisdawn.ui.theme.CrtSurface
import tech.jakedavis.aegisdawn.ui.theme.CrtTextDim

@Composable
fun LoadoutTabContent(
    session: SessionState,
    viewModel: AegisViewModel
) {
    val context = LocalContext.current
    val loadout = remember { CrewGearLoader.loadFromAssets(context) }
    val maxEndurance = 12
    var endurance by remember { mutableIntStateOf(maxEndurance) }
    var lastRolledItem by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // Personal Vitals & Armor Header
        CrtTerminalBox(
            title = "PERSONAL VITALS // ${session.activeRole.displayName.uppercase()}",
            borderColor = if (endurance <= 0) CrtAlert else CrtPhosphorDim
        ) {
            CrtSegmentedBar(
                label = "ENDURANCE / HP",
                current = endurance,
                max = maxEndurance,
                accentColor = when {
                    endurance <= 0 -> CrtAlert
                    endurance <= maxEndurance / 2 -> CrtAmber
                    else -> CrtPhosphor
                },
                onDecrement = { endurance = (endurance - 1).coerceAtLeast(0) },
                onIncrement = { endurance = (endurance + 1).coerceAtMost(maxEndurance) }
            )
            Spacer(modifier = Modifier.height(6.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                CrtButton("-3 END", { endurance = (endurance - 3).coerceAtLeast(0) }, accentColor = CrtAlert, modifier = Modifier.weight(1f))
                CrtButton("+3 END", { endurance = (endurance + 3).coerceAtMost(maxEndurance) }, accentColor = CrtPhosphor, modifier = Modifier.weight(1f))
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = loadout.armor.name.uppercase(),
                        style = MaterialTheme.typography.titleMedium,
                        color = CrtPhosphor
                    )
                    Text(
                        text = loadout.armor.trait,
                        style = MaterialTheme.typography.labelSmall,
                        color = CrtTextDim
                    )
                }
                CrtStatusBadge(
                    text = "ARMOR +${loadout.armor.rating}",
                    color = CrtAmber
                )
            }
        }

        if (endurance <= 0) {
            // Emergency Stabilization / Medic Tracker (5.2)
            StabilizationTrackerCard(
                session = session,
                onMedicRoll = {
                    viewModel.roll2d6(session.activeRole.code, "MEDIC STABILIZATION", modifier = 1)
                },
                onStabilize = { endurance = 1 },
                onManDownPing = {
                    viewModel.sendPing(
                        from = session.activeRole,
                        to = StationRole.COMMAND,
                        message = "MEDICAL EMERGENCY: ${session.activeRole.displayName} is at 0 ENDURANCE!"
                    )
                }
            )
        } else {
            if (lastRolledItem != null) {
                CrtStatusBadge(
                    text = "ROLLED $lastRolledItem -> SENT TO [ FEED ]",
                    color = CrtAmber,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            // Tappable Weapon & Gear Cards
            CrtTerminalBox(title = "TAP GEAR CARD TO ROLL 2D6 -> FEED") {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    loadout.items.forEach { card ->
                        GearCardRow(
                            card = card,
                            onTap = {
                                viewModel.roll2d6(
                                    sender = session.activeRole.code,
                                    label = card.name.uppercase(),
                                    modifier = card.rollMod
                                )
                                lastRolledItem = card.name.uppercase()
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun GearCardRow(
    card: GearCard,
    onTap: () -> Unit
) {
    val modStr = if (card.rollMod >= 0) "+${card.rollMod}" else "${card.rollMod}"
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(CrtSurface, RoundedCornerShape(2.dp))
            .border(1.dp, CrtPhosphorDim, RoundedCornerShape(2.dp))
            .clickable(onClick = onTap)
            .padding(10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = card.name.uppercase(),
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = CrtPhosphor
            )
            CrtStatusBadge(
                text = "2D6$modStr // ${card.category}",
                color = if (card.category == "WEAPON") CrtAmber else CrtPhosphor
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "EFFECT: ${card.effect}  |  RANGE: ${card.range}",
            style = MaterialTheme.typography.labelSmall,
            color = CrtAmber
        )
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = card.trait,
            style = MaterialTheme.typography.bodyMedium,
            color = CrtTextDim
        )
    }
}

@Composable
private fun StabilizationTrackerCard(
    session: SessionState,
    onMedicRoll: () -> Unit,
    onStabilize: () -> Unit,
    onManDownPing: () -> Unit
) {
    var airwayChecked by remember { mutableStateOf(false) }
    var bleedSealed by remember { mutableStateOf(false) }

    CrtTerminalBox(
        title = "CRITICAL // STABILIZATION & MEDIC TRACKER",
        borderColor = CrtAlert
    ) {
        Text(
            text = "ENDURANCE AT 0 — CREW MEMBER INCAPACITATED",
            style = MaterialTheme.typography.titleMedium,
            color = CrtAlert
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = "Perform Medic (8+) check or apply Field Trauma Medkit to stabilize before permanent attribute loss.",
            style = MaterialTheme.typography.bodyMedium,
            color = CrtAmber
        )
        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            CrtButton(
                text = if (airwayChecked) "[X] AIRWAY" else "[ ] AIRWAY",
                onClick = { airwayChecked = !airwayChecked },
                accentColor = if (airwayChecked) CrtPhosphor else CrtAmber,
                filled = airwayChecked,
                modifier = Modifier.weight(1f)
            )
            CrtButton(
                text = if (bleedSealed) "[X] SEALED" else "[ ] BLEED SEAL",
                onClick = { bleedSealed = !bleedSealed },
                accentColor = if (bleedSealed) CrtPhosphor else CrtAmber,
                filled = bleedSealed,
                modifier = Modifier.weight(1f)
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        CrtButton(
            text = "MEDIC CHECK (2D6+1) -> FEED",
            onClick = onMedicRoll,
            accentColor = CrtAmber,
            filled = true,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(6.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            CrtButton(
                text = "STABILIZE (+1 END)",
                onClick = onStabilize,
                accentColor = CrtPhosphor,
                filled = true,
                modifier = Modifier.weight(1f)
            )
            CrtButton(
                text = "PING: MAN DOWN",
                onClick = onManDownPing,
                accentColor = CrtAlert,
                modifier = Modifier.weight(1f)
            )
        }
    }
}
