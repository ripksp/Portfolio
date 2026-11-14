package tech.jacobdavis.aegisdawn.ui.screens

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import tech.jacobdavis.aegisdawn.model.CommlinkTab
import tech.jacobdavis.aegisdawn.model.FeedEntry
import tech.jacobdavis.aegisdawn.model.FeedEntryType
import tech.jacobdavis.aegisdawn.model.SessionState
import tech.jacobdavis.aegisdawn.model.StationPing
import tech.jacobdavis.aegisdawn.model.StationRole
import tech.jacobdavis.aegisdawn.model.Subsystem
import tech.jacobdavis.aegisdawn.ui.AegisViewModel
import tech.jacobdavis.aegisdawn.ui.components.CrtButton
import tech.jacobdavis.aegisdawn.ui.components.CrtSegmentedBar
import tech.jacobdavis.aegisdawn.ui.components.CrtStatusBadge
import tech.jacobdavis.aegisdawn.ui.components.CrtTerminalBox
import tech.jacobdavis.aegisdawn.ui.theme.CrtAlert
import tech.jacobdavis.aegisdawn.ui.theme.CrtAmber
import tech.jacobdavis.aegisdawn.ui.theme.CrtPhosphor
import tech.jacobdavis.aegisdawn.ui.theme.CrtPhosphorDim
import tech.jacobdavis.aegisdawn.ui.theme.CrtSurface
import tech.jacobdavis.aegisdawn.ui.theme.CrtTextDim
import tech.jacobdavis.aegisdawn.ui.theme.CrtVoid

@Composable
fun PlayerCommlinkScreen(
    session: SessionState,
    viewModel: AegisViewModel,
    onDisconnect: () -> Unit
) {
    var activeTab by remember { mutableStateOf(CommlinkTab.BRIDGE) }

    Scaffold(
        containerColor = CrtVoid,
        topBar = {
            CommlinkTopBar(session = session, onDisconnect = onDisconnect)
        },
        bottomBar = {
            CommlinkBottomTabs(
                activeTab = activeTab,
                onSelectTab = { activeTab = it }
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 10.dp, vertical = 8.dp)
        ) {
            when (activeTab) {
                CommlinkTab.BRIDGE -> BridgeTabContent(session = session, viewModel = viewModel)
                CommlinkTab.LOADOUT -> LoadoutTabContent(session = session, viewModel = viewModel)
                CommlinkTab.FEED -> FeedTabContent(session = session, viewModel = viewModel)
            }
        }
    }
}

@Composable
private fun CommlinkTopBar(
    session: SessionState,
    onDisconnect: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(CrtSurface)
            .border(1.dp, if (session.meta.hostileContact) CrtAlert else CrtPhosphorDim)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = "LUCKY BREAK // ${session.pin}",
                style = MaterialTheme.typography.titleMedium,
                color = if (session.meta.hostileContact) CrtAlert else CrtPhosphor
            )
            Text(
                text = "STATION: ${session.activeRole.displayName.uppercase()}",
                style = MaterialTheme.typography.labelSmall,
                color = CrtAmber
            )
        }
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (session.meta.hostileContact) {
                CrtStatusBadge(text = "HOSTILE", color = CrtAlert)
            }
            CrtButton(
                text = "EXIT",
                onClick = onDisconnect,
                accentColor = CrtTextDim
            )
        }
    }
}

@Composable
private fun CommlinkBottomTabs(
    activeTab: CommlinkTab,
    onSelectTab: (CommlinkTab) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(CrtSurface)
            .border(1.dp, CrtPhosphorDim)
            .padding(6.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        CommlinkTab.entries.forEach { tab ->
            val selected = tab == activeTab
            Box(
                modifier = Modifier
                    .weight(1f)
                    .background(
                        if (selected) CrtPhosphor.copy(alpha = 0.20f) else CrtVoid,
                        RoundedCornerShape(2.dp)
                    )
                    .border(
                        width = if (selected) 2.dp else 1.dp,
                        color = if (selected) CrtPhosphor else CrtPhosphorDim,
                        shape = RoundedCornerShape(2.dp)
                    )
                    .clickable { onSelectTab(tab) }
                    .padding(vertical = 10.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "[ ${tab.label} ]",
                    style = MaterialTheme.typography.labelLarge,
                    color = if (selected) CrtPhosphor else CrtTextDim
                )
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun BridgeTabContent(
    session: SessionState,
    viewModel: AegisViewModel
) {
    val incomingPing = incomingPingFor(session)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // Incoming Ping Banner
        if (incomingPing != null) {
            CrtTerminalBox(
                title = "INCOMING PING // FROM ${incomingPing.from.displayName.uppercase()}",
                borderColor = CrtAmber
            ) {
                Text(
                    text = incomingPing.message,
                    style = MaterialTheme.typography.bodyLarge,
                    color = CrtAmber
                )
                Spacer(modifier = Modifier.height(6.dp))
                CrtButton(
                    text = "[ ACKNOWLEDGE ]",
                    onClick = { viewModel.acknowledgePing(session.activeRole) },
                    accentColor = CrtAmber,
                    filled = true
                )
            }
        }

        // Shared Ship Pools (Permissive steppers)
        CrtTerminalBox(title = "SHIP TELEMETRY // ${session.tacticalMap.orbital.systemName.uppercase()}") {
            CrtSegmentedBar(
                label = "HULL INTEGRITY",
                current = session.shipState.hull.current,
                max = session.shipState.hull.max,
                accentColor = when {
                    session.shipState.hull.current <= 0 -> CrtAlert
                    session.shipState.hull.current < session.shipState.hull.max / 2 -> CrtAmber
                    else -> CrtPhosphor
                },
                onDecrement = { viewModel.adjustHull(-1) },
                onIncrement = { viewModel.adjustHull(1) }
            )
            Spacer(modifier = Modifier.height(8.dp))
            CrtSegmentedBar(
                label = "THRUST POOL",
                current = session.shipState.thrustPool.remaining,
                max = session.shipState.thrustPool.total,
                accentColor = CrtPhosphor,
                onDecrement = { viewModel.adjustThrust(-1) },
                onIncrement = { viewModel.adjustThrust(1) }
            )
            Spacer(modifier = Modifier.height(8.dp))
            val pAlloc = session.shipState.power.allocated
            Text(
                text = "POWER: ${pAlloc.totalAllocated}/${session.shipState.power.available} (M-DRV ${pAlloc.mDrive} | WPN ${pAlloc.weapons} | SEN ${pAlloc.sensors})",
                style = MaterialTheme.typography.labelSmall,
                color = if (pAlloc.totalAllocated > session.shipState.power.available) CrtAmber else CrtTextDim
            )
        }

        // Station-Specific Controls
        when (session.activeRole) {
            StationRole.PILOT -> PilotConsole(session, viewModel)
            StationRole.COMMAND -> CommandConsole(session, viewModel)
            StationRole.ENGINEER -> EngineerConsole(session, viewModel)
            StationRole.GUNNER -> GunnerConsole(session, viewModel)
            StationRole.SENSORS -> SensorsConsole(session, viewModel)
            StationRole.REFEREE -> {
                CrtTerminalBox(title = "REFEREE COMPACT MODE", borderColor = CrtAmber) {
                    Text(
                        text = "Unfold device (>= 600dp) for full Dual-Pane Referee Command Deck.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = CrtAmber
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        CrtButton(
                            text = "HOSTILE TOGGLE",
                            onClick = { viewModel.toggleHostileContact() },
                            accentColor = CrtAlert
                        )
                        CrtButton(
                            text = "A.R.I.A. SCAN",
                            onClick = { viewModel.triggerAriaScan() },
                            accentColor = CrtPhosphor
                        )
                    }
                }
            }
        }

        // Cross-Station Pings
        CrtTerminalBox(title = "CROSS-STATION PING / NUDGE") {
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                StationRole.entries
                    .filter { it != StationRole.REFEREE && it != session.activeRole }
                    .forEach { target ->
                        CrtButton(
                            text = "PING ${target.code}",
                            onClick = {
                                viewModel.sendPing(
                                    from = session.activeRole,
                                    to = target,
                                    message = "${session.activeRole.displayName} requests immediate coordination!"
                                )
                            },
                            accentColor = CrtAmber
                        )
                    }
            }
        }
    }
}

@Composable
private fun PilotConsole(session: SessionState, viewModel: AegisViewModel) {
    val pilot = session.stations.pilot
    CrtTerminalBox(title = "HELM // PILOT CONSOLE") {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            CrtButton(
                text = if (pilot.evadeActive) "EVADE: ACTIVE" else "EVADE: OFF",
                onClick = { viewModel.toggleEvade() },
                accentColor = if (pilot.evadeActive) CrtAmber else CrtPhosphor,
                filled = pilot.evadeActive,
                modifier = Modifier.weight(1f)
            )
            CrtButton(
                text = "SPEND THRUST (-1)",
                onClick = { viewModel.adjustThrust(-1) },
                modifier = Modifier.weight(1f)
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            CrtButton(
                text = "PILOT CHECK (2D6)",
                onClick = { viewModel.roll2d6("PILOT", "MANEUVER / PILOT") },
                filled = true,
                modifier = Modifier.weight(1f)
            )
            CrtButton(
                text = "REQ EVASIVE PWR",
                onClick = {
                    viewModel.sendPing(StationRole.PILOT, StationRole.ENGINEER, "Need M-Drive power for evasive burn!")
                },
                accentColor = CrtAmber,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun CommandConsole(session: SessionState, viewModel: AegisViewModel) {
    val cmd = session.stations.command
    CrtTerminalBox(title = "TACTICS // COMMAND CONSOLE") {
        Text("ASSIGN LEADERSHIP BOON (+DM):", style = MaterialTheme.typography.labelSmall)
        Spacer(modifier = Modifier.height(6.dp))
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            listOf(StationRole.PILOT, StationRole.ENGINEER, StationRole.GUNNER, StationRole.SENSORS).forEach { target ->
                val selected = cmd.boonTarget == target
                CrtButton(
                    text = target.displayName.uppercase(),
                    onClick = { viewModel.setCommandBoon(if (selected) null else target) },
                    accentColor = if (selected) CrtAmber else CrtPhosphor,
                    filled = selected
                )
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        CrtButton(
            text = "LEADERSHIP / TACTICS (2D6)",
            onClick = { viewModel.roll2d6("COMMAND", "TACTICS / LEADERSHIP") },
            filled = true,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun EngineerConsole(session: SessionState, viewModel: AegisViewModel) {
    val alloc = session.shipState.power.allocated
    val overdrive = session.stations.engineer.overdriveSystem
    CrtTerminalBox(title = "REACTOR // ENGINEER CONSOLE") {
        PowerRow("M-DRIVE", alloc.mDrive, { viewModel.allocatePower(Subsystem.M_DRIVE, -1) }, { viewModel.allocatePower(Subsystem.M_DRIVE, 1) })
        PowerRow("WEAPONS", alloc.weapons, { viewModel.allocatePower(Subsystem.WEAPONS, -1) }, { viewModel.allocatePower(Subsystem.WEAPONS, 1) })
        PowerRow("SENSORS", alloc.sensors, { viewModel.allocatePower(Subsystem.SENSORS, -1) }, { viewModel.allocatePower(Subsystem.SENSORS, 1) })
        Spacer(modifier = Modifier.height(8.dp))
        Text("OVERDRIVE SYSTEM:", style = MaterialTheme.typography.labelSmall)
        Spacer(modifier = Modifier.height(4.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            listOf(Subsystem.M_DRIVE, Subsystem.WEAPONS, Subsystem.SENSORS).forEach { sys ->
                val selected = overdrive == sys
                CrtButton(
                    text = sys.label,
                    onClick = { viewModel.setEngineerOverdrive(if (selected) null else sys) },
                    accentColor = if (selected) CrtAmber else CrtPhosphor,
                    filled = selected,
                    modifier = Modifier.weight(1f)
                )
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        CrtButton(
            text = "ENGINEER REPAIR / OVERDRIVE (2D6)",
            onClick = { viewModel.roll2d6("ENGINEER", "ENGINEERING CHECK") },
            filled = true,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun PowerRow(label: String, value: Int, onDec: () -> Unit, onInc: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, style = MaterialTheme.typography.bodyLarge)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            CrtButton(text = "-", onClick = onDec, accentColor = CrtAmber)
            Text("$value", style = MaterialTheme.typography.titleMedium, color = CrtPhosphor)
            CrtButton(text = "+", onClick = onInc, accentColor = CrtPhosphor)
        }
    }
}

@Composable
private fun GunnerConsole(session: SessionState, viewModel: AegisViewModel) {
    val locked = session.stations.gunner.lockedTargetId
    val contacts = session.tacticalMap.spaceRadar.contacts.values.toList()
    CrtTerminalBox(title = "ORDNANCE // GUNNER CONSOLE") {
        Text("SELECT TARGET LOCK:", style = MaterialTheme.typography.labelSmall)
        Spacer(modifier = Modifier.height(6.dp))
        contacts.forEach { contact ->
            val isLocked = contact.id == locked
            CrtButton(
                text = "${if (isLocked) "[LOCKED] " else ""}${contact.name} (${contact.rangeBand.label})",
                onClick = { viewModel.setGunnerTarget(if (isLocked) null else contact.id) },
                accentColor = if (isLocked) CrtAlert else CrtPhosphor,
                filled = isLocked,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 2.dp)
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        CrtButton(
            text = "FIRE TURRET // GUNNERY (2D6)",
            onClick = { viewModel.roll2d6("GUNNER", "GUNNERY ATTACK") },
            accentColor = CrtAlert,
            filled = true,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun SensorsConsole(session: SessionState, viewModel: AegisViewModel) {
    val sensors = session.stations.sensors
    CrtTerminalBox(title = "EW & INTEL // SENSORS CONSOLE") {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            CrtButton(
                text = if (sensors.ewJamming) "EW JAMMING: ON" else "EW JAMMING: OFF",
                onClick = { viewModel.toggleEwJamming() },
                accentColor = if (sensors.ewJamming) CrtAmber else CrtPhosphor,
                filled = sensors.ewJamming,
                modifier = Modifier.weight(1f)
            )
            CrtButton(
                text = "SENSOR SCAN (2D6)",
                onClick = { viewModel.roll2d6("SENSORS", "DEEP SENSOR SCAN") },
                filled = true,
                modifier = Modifier.weight(1f)
            )
        }
        if (sensors.secretIntel != null) {
            Spacer(modifier = Modifier.height(10.dp))
            CrtTerminalBox(title = "PRIVATE INTEL // SENSORS ONLY", borderColor = CrtAmber) {
                Text(sensors.secretIntel, style = MaterialTheme.typography.bodyLarge, color = CrtAmber)
                Spacer(modifier = Modifier.height(6.dp))
                CrtButton(
                    text = "[ BROADCAST TO BRIDGE ]",
                    onClick = { viewModel.broadcastSecretIntel() },
                    accentColor = CrtPhosphor,
                    filled = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

@Composable
private fun LoadoutPlaceholderTab() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CrtTerminalBox(
            title = "LOADOUT // PIP-BOY FIELD TRACKER",
            borderColor = CrtPhosphorDim,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = "MODULE SCHEDULED FOR SLICE 5",
                style = MaterialTheme.typography.titleMedium,
                color = CrtAmber
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Personal Endurance/HP steppers, Armor rating, crew_gear.json tappable item cards, and 0-HP Stabilization / Medic Tracker will mount here.",
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

@Composable
private fun FeedTabContent(
    session: SessionState,
    viewModel: AegisViewModel
) {
    var selectedMod by remember { mutableIntStateOf(0) }

    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            items(session.feed, key = { it.id }) { entry ->
                FeedEntryCard(entry)
            }
        }

        // Quick 2D6 Dice Roller Bar (Permissive, no freeform AI chat)
        CrtTerminalBox(title = "QUICK 2D6 CHECK") {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                listOf(-1, 0, 1, 2).forEach { dm ->
                    val label = if (dm > 0) "+$dm" else "$dm"
                    CrtButton(
                        text = label,
                        onClick = { selectedMod = dm },
                        accentColor = if (selectedMod == dm) CrtAmber else CrtPhosphorDim,
                        filled = selectedMod == dm
                    )
                }
                Spacer(modifier = Modifier.weight(1f))
                CrtButton(
                    text = "ROLL 2D6",
                    onClick = {
                        viewModel.roll2d6(
                            sender = session.activeRole.code,
                            label = "${session.activeRole.displayName.uppercase()} CHECK",
                            modifier = selectedMod
                        )
                    },
                    filled = true
                )
            }
        }
    }
}

@Composable
fun FeedEntryCard(entry: FeedEntry) {
    val accent: Color = when {
        entry.isSleeper -> CrtAlert
        entry.isCorrupted -> CrtAmber
        entry.type == FeedEntryType.ARIA -> CrtPhosphor
        entry.type == FeedEntryType.ROLL -> CrtPhosphor
        entry.type == FeedEntryType.PING -> CrtAmber
        entry.type == FeedEntryType.INTEL -> CrtAmber
        else -> CrtTextDim
    }

    CrtTerminalBox(
        borderColor = accent.copy(alpha = 0.7f),
        backgroundColor = CrtSurface
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "[${entry.sender}] ${entry.title}",
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                color = accent
            )
            Text(
                text = entry.timestampLabel,
                style = MaterialTheme.typography.labelSmall,
                color = CrtTextDim
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = entry.body,
            style = MaterialTheme.typography.bodyMedium,
            color = if (entry.type == FeedEntryType.ARIA) accent else CrtPhosphor
        )
    }
}

private fun incomingPingFor(session: SessionState): StationPing? = when (session.activeRole) {
    StationRole.PILOT -> session.stations.pilot.incomingPing
    StationRole.COMMAND -> session.stations.command.incomingPing
    StationRole.ENGINEER -> session.stations.engineer.incomingPing
    StationRole.GUNNER -> session.stations.gunner.incomingPing
    StationRole.SENSORS -> session.stations.sensors.incomingPing
    StationRole.REFEREE -> null
}
