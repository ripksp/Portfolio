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
import tech.jacobdavis.aegisdawn.ai.AriaGeminiClient
import tech.jacobdavis.aegisdawn.model.GroundZonePreset
import tech.jacobdavis.aegisdawn.model.RangeBand
import tech.jacobdavis.aegisdawn.model.SessionState
import tech.jacobdavis.aegisdawn.model.StationRole
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

    // Covert Mind-Virus & Comms Wiretap state
    var targetVictimRole by remember { mutableStateOf(StationRole.PILOT) }
    var virusSymptomTitle by remember { mutableStateOf("STAGE-1 CHIMERA NEURO-PARASITE") }
    var virusSecretText by remember { mutableStateOf("") }
    var refereeCommsInput by remember { mutableStateOf("") }

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

            // Covert Mind-Virus & Secret Whisper Injector
            val crewTargets = remember {
                listOf(
                    StationRole.PILOT,
                    StationRole.COMMAND,
                    StationRole.ENGINEER,
                    StationRole.GUNNER,
                    StationRole.SENSORS
                )
            }
            CrtTerminalBox(
                title = "COVERT MIND-VIRUS & WHISPER INJECTOR",
                borderColor = CrtAlert
            ) {
                Text(
                    text = "TARGET CREW STATION (SILENT EYES-ONLY INJECTION):",
                    style = MaterialTheme.typography.labelSmall,
                    color = CrtAmber
                )
                Spacer(modifier = Modifier.height(4.dp))
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    crewTargets.forEach { role ->
                        val isTarget = targetVictimRole == role
                        val isInfected = session.comms.directives.containsKey(role)
                        CrtButton(
                            text = if (isInfected) "! ${role.code}" else role.code,
                            onClick = { targetVictimRole = role },
                            accentColor = when {
                                isInfected -> CrtAlert
                                isTarget -> CrtAmber
                                else -> CrtPhosphorDim
                            },
                            filled = isTarget
                        )
                    }
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "ONE-TAP COVERT PRESETS (-> ${targetVictimRole.displayName.uppercase()}):",
                    style = MaterialTheme.typography.labelSmall,
                    color = CrtTextDim
                )
                Spacer(modifier = Modifier.height(4.dp))
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    CrtButton(
                        text = "MIND VIRUS",
                        onClick = {
                            val (title, body) = AriaGeminiClient.buildMindVirusPreset(
                                "MIND_VIRUS",
                                targetVictimRole.displayName
                            )
                            viewModel.infectOrWhisperPlayer(
                                target = targetVictimRole,
                                title = title,
                                directive = body,
                                isMindVirus = true
                            )
                        },
                        accentColor = CrtAlert,
                        filled = true
                    )
                    CrtButton(
                        text = "HALLUCINATION",
                        onClick = {
                            val (title, body) = AriaGeminiClient.buildMindVirusPreset(
                                "HALLUCINATION",
                                targetVictimRole.displayName
                            )
                            viewModel.infectOrWhisperPlayer(
                                target = targetVictimRole,
                                title = title,
                                directive = body,
                                isMindVirus = true
                            )
                        },
                        accentColor = CrtAlert
                    )
                    CrtButton(
                        text = "SLEEPER CIPHER",
                        onClick = {
                            val (title, body) = AriaGeminiClient.buildMindVirusPreset(
                                "SLEEPER_AGENT",
                                targetVictimRole.displayName
                            )
                            viewModel.infectOrWhisperPlayer(
                                target = targetVictimRole,
                                title = title,
                                directive = body,
                                isMindVirus = true
                            )
                        },
                        accentColor = CrtAmber
                    )
                    CrtButton(
                        text = "A.R.I.A. WHISPER",
                        onClick = {
                            val (title, body) = AriaGeminiClient.buildMindVirusPreset(
                                "ARIA_WHISPER",
                                targetVictimRole.displayName
                            )
                            viewModel.infectOrWhisperPlayer(
                                target = targetVictimRole,
                                title = title,
                                directive = body,
                                isMindVirus = false
                            )
                        },
                        accentColor = CrtPhosphor
                    )
                }
                Spacer(modifier = Modifier.height(6.dp))
                OutlinedTextField(
                    value = virusSymptomTitle,
                    onValueChange = { virusSymptomTitle = it },
                    singleLine = true,
                    placeholder = { Text("Symptom / Header (e.g. BIO-NEURAL SPORE)", color = CrtPhosphorDim) },
                    textStyle = MaterialTheme.typography.bodySmall,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = CrtAlert,
                        unfocusedBorderColor = CrtPhosphorDim,
                        focusedTextColor = CrtAlert,
                        unfocusedTextColor = CrtPhosphor,
                        cursorColor = CrtAlert,
                        focusedContainerColor = CrtVoid,
                        unfocusedContainerColor = CrtVoid
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedTextField(
                    value = virusSecretText,
                    onValueChange = { virusSecretText = it },
                    placeholder = {
                        Text(
                            "Custom secret directive or A.R.I.A. private whisper for ${targetVictimRole.code}...",
                            color = CrtPhosphorDim
                        )
                    },
                    textStyle = MaterialTheme.typography.bodyMedium,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = CrtAlert,
                        unfocusedBorderColor = CrtPhosphorDim,
                        focusedTextColor = CrtPhosphor,
                        unfocusedTextColor = CrtPhosphor,
                        cursorColor = CrtAlert,
                        focusedContainerColor = CrtVoid,
                        unfocusedContainerColor = CrtVoid
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    CrtButton(
                        text = "INJECT MIND VIRUS",
                        onClick = {
                            if (virusSecretText.isNotBlank()) {
                                viewModel.infectOrWhisperPlayer(
                                    target = targetVictimRole,
                                    title = virusSymptomTitle,
                                    directive = virusSecretText,
                                    isMindVirus = true
                                )
                                virusSecretText = ""
                            }
                        },
                        accentColor = CrtAlert,
                        filled = true,
                        modifier = Modifier.weight(1f)
                    )
                    CrtButton(
                        text = "WHISPER AS A.R.I.A.",
                        onClick = {
                            if (virusSecretText.isNotBlank()) {
                                viewModel.infectOrWhisperPlayer(
                                    target = targetVictimRole,
                                    title = "A.R.I.A. PRIVATE SUB-ROUTINE",
                                    directive = virusSecretText,
                                    isMindVirus = false
                                )
                                virusSecretText = ""
                            }
                        },
                        accentColor = CrtAmber,
                        modifier = Modifier.weight(1f)
                    )
                }

                // Active Infections & Directives tracker
                val activeDirectives = session.comms.directives.values.toList()
                if (activeDirectives.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "ACTIVE COVERT INFECTIONS / DIRECTIVES:",
                        style = MaterialTheme.typography.labelSmall,
                        color = CrtAlert
                    )
                    activeDirectives.forEach { dir ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 2.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "[${dir.targetRole.code}] ${dir.title}",
                                style = MaterialTheme.typography.bodySmall,
                                color = if (dir.isMindVirus) CrtAlert else CrtAmber,
                                modifier = Modifier.weight(1f)
                            )
                            CrtButton(
                                text = "CURE / CLEAR",
                                onClick = { viewModel.clearPsychDirective(dir.targetRole) },
                                accentColor = CrtPhosphor
                            )
                        }
                    }
                }
            }

            // Referee Comms Wiretap & Snoop Console
            CrtTerminalBox(
                title = "COMMS WIRETAP // REFEREE SNOOP (ALL CHANNELS)",
                borderColor = CrtAmber
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "INTERCEPTING PARTY, A.R.I.A. & PRIVATE CREW DMs",
                        style = MaterialTheme.typography.labelSmall,
                        color = CrtTextDim
                    )
                    CrtButton(
                        text = if (session.comms.ariaAutoInterject) "A.R.I.A. INTERJECT: ON" else "A.R.I.A. INTERJECT: OFF",
                        onClick = viewModel::toggleAriaAutoInterject,
                        accentColor = if (session.comms.ariaAutoInterject) CrtPhosphor else CrtPhosphorDim,
                        filled = session.comms.ariaAutoInterject
                    )
                }
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = refereeCommsInput,
                        onValueChange = { refereeCommsInput = it },
                        singleLine = true,
                        placeholder = {
                            Text(
                                "Broadcast to Party or DM -> ${targetVictimRole.code}...",
                                color = CrtPhosphorDim
                            )
                        },
                        textStyle = MaterialTheme.typography.bodyMedium,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = CrtAmber,
                            unfocusedBorderColor = CrtPhosphorDim,
                            focusedTextColor = CrtPhosphor,
                            unfocusedTextColor = CrtPhosphor,
                            cursorColor = CrtAmber,
                            focusedContainerColor = CrtVoid,
                            unfocusedContainerColor = CrtVoid
                        ),
                        modifier = Modifier.weight(1f)
                    )
                    CrtButton(
                        text = "PARTY",
                        onClick = {
                            viewModel.sendPartyMessage(StationRole.REFEREE, refereeCommsInput)
                            refereeCommsInput = ""
                        },
                        accentColor = CrtPhosphor
                    )
                    CrtButton(
                        text = "DM ${targetVictimRole.code}",
                        onClick = {
                            viewModel.sendDirectMessage(
                                from = StationRole.REFEREE,
                                to = targetVictimRole,
                                text = refereeCommsInput
                            )
                            refereeCommsInput = ""
                        },
                        accentColor = CrtAmber,
                        filled = true
                    )
                }
                Spacer(modifier = Modifier.height(6.dp))
                if (session.comms.messages.isEmpty()) {
                    Text(
                        text = "No crew comms traffic logged yet.",
                        style = MaterialTheme.typography.bodySmall,
                        color = CrtTextDim
                    )
                } else {
                    session.comms.messages.take(8).forEach { msg ->
                        CommsMessageCard(msg = msg, isRefereeSnoop = true)
                        Spacer(modifier = Modifier.height(4.dp))
                    }
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
