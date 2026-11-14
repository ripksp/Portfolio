package tech.jacobdavis.aegisdawn.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import tech.jacobdavis.aegisdawn.model.GroundZonePreset
import tech.jacobdavis.aegisdawn.model.RangeBand
import tech.jacobdavis.aegisdawn.model.SessionState
import tech.jacobdavis.aegisdawn.model.Subsystem
import tech.jacobdavis.aegisdawn.ui.AegisViewModel
import tech.jacobdavis.aegisdawn.ui.components.CrtButton
import tech.jacobdavis.aegisdawn.ui.components.CrtSegmentedBar
import tech.jacobdavis.aegisdawn.ui.components.CrtTerminalBox
import tech.jacobdavis.aegisdawn.ui.components.TacticalViewport
import tech.jacobdavis.aegisdawn.ui.theme.CrtAlert
import tech.jacobdavis.aegisdawn.ui.theme.CrtAmber
import tech.jacobdavis.aegisdawn.ui.theme.CrtPhosphor
import tech.jacobdavis.aegisdawn.ui.theme.CrtPhosphorDim
import tech.jacobdavis.aegisdawn.ui.theme.CrtSurface
import tech.jacobdavis.aegisdawn.ui.theme.CrtTextDim
import tech.jacobdavis.aegisdawn.ui.theme.CrtVoid

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun RefereeDeckScreen(
    session: SessionState,
    viewModel: AegisViewModel,
    onDisconnect: () -> Unit
) {
    var quickInjectText by remember { mutableStateOf("") }
    var geminiKeyInput by remember { mutableStateOf("") }
    var ruleCardQuery by remember { mutableStateOf("") }
    var contactNameInput by remember { mutableStateOf("") }
    var contactHostile by remember { mutableStateOf(true) }
    var tokenNameInput by remember { mutableStateOf("") }
    var tokenHostile by remember { mutableStateOf(true) }

    Row(
        modifier = Modifier
            .fillMaxSize()
            .background(CrtVoid)
            .padding(8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // LEFT PANE: Live Mirror of Xbox Bridge Viewscreen
        TacticalViewport(
            session = session,
            onSelectViewMode = viewModel::setViewMode,
            onMoveGroundToken = viewModel::moveGroundToken,
            modifier = Modifier
                .weight(1f)
                .fillMaxHeight()
        )

        // RIGHT PANE: Referee State Injectors & A.R.I.A. Controls
        Column(
            modifier = Modifier
                .weight(1f)
                .fillMaxHeight()
                .background(CrtSurface)
                .border(1.dp, CrtPhosphorDim)
                .padding(10.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "REFEREE COMMAND DECK",
                        style = MaterialTheme.typography.titleMedium,
                        color = CrtAmber
                    )
                    Text(
                        text = "SESSION: ${session.pin} // ROLE: ${session.activeRole.displayName.uppercase()}",
                        style = MaterialTheme.typography.labelSmall,
                        color = CrtTextDim
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    CrtButton(
                        text = if (session.meta.hostileContact) "HOSTILE: ON" else "HOSTILE: OFF",
                        onClick = viewModel::toggleHostileContact,
                        accentColor = if (session.meta.hostileContact) CrtAlert else CrtPhosphor,
                        filled = session.meta.hostileContact
                    )
                    CrtButton(
                        text = "EXIT",
                        onClick = onDisconnect,
                        accentColor = CrtTextDim
                    )
                }
            }

            // Ship Pools
            CrtTerminalBox(title = "SHIP POOL OVERRIDES") {
                CrtSegmentedBar(
                    label = "HULL",
                    current = session.shipState.hull.current,
                    max = session.shipState.hull.max,
                    accentColor = if (session.shipState.hull.current <= 0) CrtAlert else CrtPhosphor,
                    onDecrement = { viewModel.adjustHull(-5) },
                    onIncrement = { viewModel.adjustHull(5) }
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    CrtButton("-1 HULL", { viewModel.adjustHull(-1) }, accentColor = CrtAmber, modifier = Modifier.weight(1f))
                    CrtButton("+1 HULL", { viewModel.adjustHull(1) }, accentColor = CrtPhosphor, modifier = Modifier.weight(1f))
                    CrtButton("-1 THRUST", { viewModel.adjustThrust(-1) }, accentColor = CrtAmber, modifier = Modifier.weight(1f))
                    CrtButton("+1 THRUST", { viewModel.adjustThrust(1) }, accentColor = CrtPhosphor, modifier = Modifier.weight(1f))
                }
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "POWER AVAILABLE: ${session.shipState.power.available}",
                        style = MaterialTheme.typography.labelLarge
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        CrtButton("-1 PWR", { viewModel.adjustPowerAvailable(-1) }, accentColor = CrtAmber)
                        CrtButton("+1 PWR", { viewModel.adjustPowerAvailable(1) }, accentColor = CrtPhosphor)
                    }
                }
            }

            // Subsystem Crit Steppers
            CrtTerminalBox(title = "SUBSYSTEM CRIT STEPPERS") {
                val crits = session.shipState.crits
                CritStepperRow("M-DRIVE", crits.mDrive, { viewModel.adjustCrit(Subsystem.M_DRIVE, -1) }, { viewModel.adjustCrit(Subsystem.M_DRIVE, 1) })
                CritStepperRow("PWR PLANT", crits.powerPlant, { viewModel.adjustCrit(Subsystem.POWER_PLANT, -1) }, { viewModel.adjustCrit(Subsystem.POWER_PLANT, 1) })
                CritStepperRow("SENSORS", crits.sensors, { viewModel.adjustCrit(Subsystem.SENSORS, -1) }, { viewModel.adjustCrit(Subsystem.SENSORS, 1) })
                CritStepperRow("WEAPONS", crits.weapons, { viewModel.adjustCrit(Subsystem.WEAPONS, -1) }, { viewModel.adjustCrit(Subsystem.WEAPONS, 1) })
                CritStepperRow("COMPUTER (A.R.I.A.)", crits.computer, { viewModel.adjustCrit(Subsystem.COMPUTER, -1) }, { viewModel.adjustCrit(Subsystem.COMPUTER, 1) })
            }

            // Quick-Inject Keyword Bar
            CrtTerminalBox(title = "QUICK-INJECT PARSER") {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = quickInjectText,
                        onValueChange = { quickInjectText = it },
                        singleLine = true,
                        placeholder = { Text("Derelict / Corp Patrol / Bio-Gas Swamp", color = CrtPhosphorDim) },
                        textStyle = MaterialTheme.typography.bodyMedium,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = CrtPhosphor,
                            unfocusedBorderColor = CrtPhosphorDim,
                            focusedTextColor = CrtPhosphor,
                            unfocusedTextColor = CrtPhosphor,
                            cursorColor = CrtPhosphor,
                            focusedContainerColor = CrtVoid,
                            unfocusedContainerColor = CrtVoid
                        ),
                        modifier = Modifier.weight(1f)
                    )
                    CrtButton(
                        text = "INJECT",
                        onClick = {
                            viewModel.quickInjectSystem(quickInjectText)
                            quickInjectText = ""
                        },
                        filled = true
                    )
                }
            }

            // A.R.I.A. State Controls
            CrtTerminalBox(
                title = "A.R.I.A. HEURISTIC CONTROLS",
                borderColor = when {
                    session.meta.ariaSleeperTriggered -> CrtAlert
                    session.meta.ariaCorrupted -> CrtAmber
                    else -> CrtPhosphorDim
                }
            ) {
                Text("MEMORY UNLOCK TIER:", style = MaterialTheme.typography.labelSmall)
                Spacer(modifier = Modifier.height(4.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    (1..4).forEach { tier ->
                        val selected = session.meta.ariaUnlockTier == tier
                        CrtButton(
                            text = "T$tier",
                            onClick = { viewModel.setAriaTier(tier) },
                            accentColor = if (selected) CrtAmber else CrtPhosphorDim,
                            filled = selected,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    CrtButton(
                        text = if (session.meta.ariaCorrupted) "CORRUPTED: ON" else "CORRUPTED: OFF",
                        onClick = viewModel::toggleAriaCorrupted,
                        accentColor = if (session.meta.ariaCorrupted) CrtAmber else CrtPhosphorDim,
                        filled = session.meta.ariaCorrupted
                    )
                    CrtButton(
                        text = if (session.meta.ariaSleeperTriggered) "SLEEPER: ACTIVE" else "SLEEPER: DORMANT",
                        onClick = viewModel::toggleAriaSleeper,
                        accentColor = if (session.meta.ariaSleeperTriggered) CrtAlert else CrtPhosphorDim,
                        filled = session.meta.ariaSleeperTriggered
                    )
                    CrtButton(
                        text = "TRIGGER A.R.I.A. SCAN",
                        onClick = viewModel::triggerAriaScan,
                        filled = true
                    )
                    CrtButton(
                        text = "PUSH SECRET INTEL -> SENSORS",
                        onClick = {
                            viewModel.pushSecretIntel(
                                "ENCRYPTED BIO-BEACON: Pre-collapse containment seal failing on sub-level 3."
                            )
                        },
                        accentColor = CrtAmber
                    )
                }
            }

            // Gemini API Key Seeding (4.1)
            val hasKey = session.meta.geminiKeyCipher.isNotBlank()
            CrtTerminalBox(
                title = if (hasKey) "GEMINI 2.5 FLASH // KEY SEEDED" else "GEMINI 2.5 FLASH // NO KEY",
                borderColor = if (hasKey) CrtPhosphor else CrtAmber
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = geminiKeyInput,
                        onValueChange = { geminiKeyInput = it },
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        placeholder = { Text("Paste Gemini API Key...", color = CrtPhosphorDim) },
                        textStyle = MaterialTheme.typography.bodyMedium,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = CrtPhosphor,
                            unfocusedBorderColor = CrtPhosphorDim,
                            focusedTextColor = CrtPhosphor,
                            unfocusedTextColor = CrtPhosphor,
                            cursorColor = CrtPhosphor,
                            focusedContainerColor = CrtVoid,
                            unfocusedContainerColor = CrtVoid
                        ),
                        modifier = Modifier.weight(1f)
                    )
                    CrtButton(
                        text = "SEED KEY",
                        onClick = {
                            viewModel.seedGeminiKey(geminiKeyInput)
                            geminiKeyInput = ""
                        },
                        filled = true
                    )
                }
            }

            // Quick Rule / Gear Card Lookup (4.2)
            CrtTerminalBox(title = "QUICK RULE / GEAR CARD -> FEED") {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = ruleCardQuery,
                        onValueChange = { ruleCardQuery = it },
                        singleLine = true,
                        placeholder = { Text("e.g. Vacc Suit / Zero-G Combat", color = CrtPhosphorDim) },
                        textStyle = MaterialTheme.typography.bodyMedium,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = CrtPhosphor,
                            unfocusedBorderColor = CrtPhosphorDim,
                            focusedTextColor = CrtPhosphor,
                            unfocusedTextColor = CrtPhosphor,
                            cursorColor = CrtPhosphor,
                            focusedContainerColor = CrtVoid,
                            unfocusedContainerColor = CrtVoid
                        ),
                        modifier = Modifier.weight(1f)
                    )
                    CrtButton(
                        text = "PUSH CARD",
                        onClick = {
                            viewModel.pushQuickRuleCard(ruleCardQuery)
                            ruleCardQuery = ""
                        },
                        accentColor = CrtAmber,
                        filled = true
                    )
                }
            }

            // Space Radar Contact Spawner
            CrtTerminalBox(title = "SPACE RADAR SPAWNER") {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = contactNameInput,
                        onValueChange = { contactNameInput = it },
                        singleLine = true,
                        placeholder = { Text("Contact (e.g. Voidbreaker Corsair)", color = CrtPhosphorDim) },
                        textStyle = MaterialTheme.typography.bodyMedium,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = CrtPhosphor,
                            unfocusedBorderColor = CrtPhosphorDim,
                            focusedTextColor = CrtPhosphor,
                            unfocusedTextColor = CrtPhosphor,
                            cursorColor = CrtPhosphor,
                            focusedContainerColor = CrtVoid,
                            unfocusedContainerColor = CrtVoid
                        ),
                        modifier = Modifier.weight(1f)
                    )
                    CrtButton(
                        text = if (contactHostile) "HOSTILE" else "NEUTRAL",
                        onClick = { contactHostile = !contactHostile },
                        accentColor = if (contactHostile) CrtAlert else CrtAmber,
                        filled = contactHostile
                    )
                    CrtButton(
                        text = "SPAWN",
                        onClick = {
                            viewModel.addRadarContact(
                                name = contactNameInput.ifBlank { "CORSAIR RAIDER" },
                                rangeBand = RangeBand.LONG,
                                hostile = contactHostile
                            )
                            contactNameInput = ""
                        },
                        filled = true
                    )
                }
                Spacer(modifier = Modifier.height(6.dp))
                session.tacticalMap.spaceRadar.contacts.values.forEach { contact ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "${contact.name} (${contact.rangeBand.label})",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (contact.hostile) CrtAlert else CrtAmber,
                            modifier = Modifier.weight(1f)
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            val bands = RangeBand.entries
                            val idx = bands.indexOf(contact.rangeBand)
                            CrtButton(
                                text = "<-",
                                onClick = {
                                    if (idx > 0) viewModel.updateContactRange(contact.id, bands[idx - 1])
                                },
                                enabled = idx > 0
                            )
                            CrtButton(
                                text = "->",
                                onClick = {
                                    if (idx < bands.lastIndex) viewModel.updateContactRange(contact.id, bands[idx + 1])
                                },
                                enabled = idx < bands.lastIndex
                            )
                            CrtButton(
                                text = "X",
                                onClick = { viewModel.removeRadarContact(contact.id) },
                                accentColor = CrtAlert
                            )
                        }
                    }
                }
            }

            // Ground Zone Presets & Token Spawner
            CrtTerminalBox(title = "GROUND ZONES // PRESETS & TOKENS") {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    GroundZonePreset.entries.forEach { preset ->
                        CrtButton(
                            text = preset.label,
                            onClick = { viewModel.loadGroundZonePreset(preset) },
                            accentColor = CrtPhosphor,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = tokenNameInput,
                        onValueChange = { tokenNameInput = it },
                        singleLine = true,
                        placeholder = { Text("Token (e.g. Chimera / Marine)", color = CrtPhosphorDim) },
                        textStyle = MaterialTheme.typography.bodyMedium,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = CrtPhosphor,
                            unfocusedBorderColor = CrtPhosphorDim,
                            focusedTextColor = CrtPhosphor,
                            unfocusedTextColor = CrtPhosphor,
                            cursorColor = CrtPhosphor,
                            focusedContainerColor = CrtVoid,
                            unfocusedContainerColor = CrtVoid
                        ),
                        modifier = Modifier.weight(1f)
                    )
                    CrtButton(
                        text = if (tokenHostile) "FOE" else "ALLY",
                        onClick = { tokenHostile = !tokenHostile },
                        accentColor = if (tokenHostile) CrtAlert else CrtPhosphor,
                        filled = tokenHostile
                    )
                    CrtButton(
                        text = "ADD",
                        onClick = {
                            viewModel.addGroundToken(
                                label = tokenNameInput.ifBlank { if (tokenHostile) "HOSTILE" else "CREW" },
                                isHostile = tokenHostile
                            )
                            tokenNameInput = ""
                        },
                        filled = true
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    session.tacticalMap.groundZones.tokens.values.forEach { tok ->
                        CrtButton(
                            text = "X ${tok.label}",
                            onClick = { viewModel.removeGroundToken(tok.id) },
                            accentColor = if (tok.isHostile) CrtAlert else CrtTextDim
                        )
                    }
                }
            }

            // Recent Feed Entries
            CrtTerminalBox(title = "RECENT BRIDGE FEED") {
                session.feed.take(4).forEach { entry ->
                    FeedEntryCard(entry)
                    Spacer(modifier = Modifier.height(4.dp))
                }
            }
        }
    }
}

@Composable
private fun CritStepperRow(
    label: String,
    level: Int,
    onDec: () -> Unit,
    onInc: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = if (level > 0) CrtAlert else CrtTextDim
        )
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            CrtButton("-", onDec, accentColor = CrtPhosphorDim)
            Text(
                text = "LVL $level",
                style = MaterialTheme.typography.labelLarge,
                color = if (level > 0) CrtAlert else CrtPhosphor
            )
            CrtButton("+", onInc, accentColor = CrtAlert)
        }
    }
}
