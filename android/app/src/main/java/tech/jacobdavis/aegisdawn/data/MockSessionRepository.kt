package tech.jacobdavis.aegisdawn.data

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import tech.jacobdavis.aegisdawn.model.CritsState
import tech.jacobdavis.aegisdawn.model.DiceRollDetail
import tech.jacobdavis.aegisdawn.model.FeedEntry
import tech.jacobdavis.aegisdawn.model.FeedEntryType
import tech.jacobdavis.aegisdawn.model.GroundNode
import tech.jacobdavis.aegisdawn.model.GroundToken
import tech.jacobdavis.aegisdawn.model.GroundZonesState
import tech.jacobdavis.aegisdawn.model.OrbitalScanState
import tech.jacobdavis.aegisdawn.model.RadarContact
import tech.jacobdavis.aegisdawn.model.RangeBand
import tech.jacobdavis.aegisdawn.model.SessionMeta
import tech.jacobdavis.aegisdawn.model.SessionState
import tech.jacobdavis.aegisdawn.model.ShipState
import tech.jacobdavis.aegisdawn.model.SpaceRadarState
import tech.jacobdavis.aegisdawn.model.StationPing
import tech.jacobdavis.aegisdawn.model.StationRole
import tech.jacobdavis.aegisdawn.model.StationsState
import tech.jacobdavis.aegisdawn.model.Subsystem
import tech.jacobdavis.aegisdawn.model.TacticalMapState
import tech.jacobdavis.aegisdawn.model.ViewMode
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID
import kotlin.random.Random

class MockSessionRepository(
    private val random: Random = Random.Default
) : SessionRepository {

    private val _sessionState = MutableStateFlow<SessionState?>(null)
    override val sessionState: StateFlow<SessionState?> = _sessionState.asStateFlow()

    private val timeFormatter = SimpleDateFormat("HH:mm:ss", Locale.US)

    override fun connect(pin: String, role: StationRole) {
        val normalizedPin = pin.trim().uppercase().take(4).ifEmpty { "AEGS" }
        val existing = _sessionState.value
        if (existing != null && existing.pin == normalizedPin) {
            _sessionState.value = existing.copy(activeRole = role)
            return
        }
        _sessionState.value = buildInitialMockSession(normalizedPin, role)
    }

    override fun disconnect() {
        _sessionState.value = null
    }

    override fun adjustHull(delta: Int) {
        _sessionState.update { state ->
            state ?: return@update null
            val newCurrent = (state.shipState.hull.current + delta).coerceIn(0, state.shipState.hull.max)
            val updated = state.copy(
                shipState = state.shipState.copy(
                    hull = state.shipState.hull.copy(current = newCurrent)
                )
            )
            if (newCurrent == 0 && state.shipState.hull.current > 0) {
                appendFeed(
                    updated,
                    FeedEntryType.ARIA,
                    "A.R.I.A.",
                    "HULL BREACH // SURVIVAL PROTOCOL",
                    "Bulkhead integrity at zero. Routing auxiliary power to escape rails; your statistical survival odds just became decorative.",
                    isCorrupted = updated.meta.ariaCorrupted,
                    isSleeper = updated.meta.ariaSleeperTriggered
                )
            } else {
                updated
            }
        }
    }

    override fun adjustThrust(delta: Int) {
        _sessionState.update { state ->
            state ?: return@update null
            val pool = state.shipState.thrustPool
            val newRemaining = (pool.remaining + delta).coerceIn(0, pool.total)
            state.copy(
                shipState = state.shipState.copy(
                    thrustPool = pool.copy(remaining = newRemaining)
                )
            )
        }
    }

    override fun adjustPowerAvailable(delta: Int) {
        _sessionState.update { state ->
            state ?: return@update null
            val power = state.shipState.power
            val newAvail = (power.available + delta).coerceIn(0, 24)
            state.copy(
                shipState = state.shipState.copy(
                    power = power.copy(available = newAvail)
                )
            )
        }
    }

    override fun allocatePower(system: Subsystem, delta: Int) {
        _sessionState.update { state ->
            state ?: return@update null
            val alloc = state.shipState.power.allocated
            val updatedAlloc = when (system) {
                Subsystem.M_DRIVE -> alloc.copy(mDrive = (alloc.mDrive + delta).coerceIn(0, 12))
                Subsystem.WEAPONS -> alloc.copy(weapons = (alloc.weapons + delta).coerceIn(0, 12))
                Subsystem.SENSORS -> alloc.copy(sensors = (alloc.sensors + delta).coerceIn(0, 12))
                else -> alloc
            }
            state.copy(
                shipState = state.shipState.copy(
                    power = state.shipState.power.copy(allocated = updatedAlloc)
                )
            )
        }
    }

    override fun adjustCrit(system: Subsystem, delta: Int) {
        _sessionState.update { state ->
            state ?: return@update null
            val crits = state.shipState.crits
            val updatedCrits = when (system) {
                Subsystem.M_DRIVE -> crits.copy(mDrive = (crits.mDrive + delta).coerceIn(0, 3))
                Subsystem.POWER_PLANT -> crits.copy(powerPlant = (crits.powerPlant + delta).coerceIn(0, 3))
                Subsystem.SENSORS -> crits.copy(sensors = (crits.sensors + delta).coerceIn(0, 3))
                Subsystem.WEAPONS -> crits.copy(weapons = (crits.weapons + delta).coerceIn(0, 3))
                Subsystem.COMPUTER -> crits.copy(computer = (crits.computer + delta).coerceIn(0, 3))
            }
            val computerCorrupted = updatedCrits.computer > 0 || state.meta.ariaCorrupted
            val next = state.copy(
                shipState = state.shipState.copy(crits = updatedCrits),
                meta = state.meta.copy(ariaCorrupted = computerCorrupted)
            )
            if (delta > 0) {
                appendFeed(
                    next,
                    FeedEntryType.SYSTEM,
                    "DAMAGE CTRL",
                    "CRIT: ${system.label}",
                    "Severity increased to ${critLevelFor(updatedCrits, system)}.",
                    isCorrupted = computerCorrupted
                )
            } else {
                next
            }
        }
    }

    override fun toggleEvade() {
        _sessionState.update { state ->
            state ?: return@update null
            val nextVal = !state.stations.pilot.evadeActive
            state.copy(
                stations = state.stations.copy(
                    pilot = state.stations.pilot.copy(evadeActive = nextVal)
                )
            )
        }
    }

    override fun setCommandBoon(target: StationRole?) {
        _sessionState.update { state ->
            state ?: return@update null
            state.copy(
                stations = state.stations.copy(
                    command = state.stations.command.copy(boonTarget = target)
                )
            )
        }
    }

    override fun setEngineerOverdrive(system: Subsystem?) {
        _sessionState.update { state ->
            state ?: return@update null
            state.copy(
                stations = state.stations.copy(
                    engineer = state.stations.engineer.copy(overdriveSystem = system)
                )
            )
        }
    }

    override fun setGunnerTarget(contactId: String?) {
        _sessionState.update { state ->
            state ?: return@update null
            state.copy(
                stations = state.stations.copy(
                    gunner = state.stations.gunner.copy(lockedTargetId = contactId)
                )
            )
        }
    }

    override fun toggleEwJamming() {
        _sessionState.update { state ->
            state ?: return@update null
            val nextVal = !state.stations.sensors.ewJamming
            state.copy(
                stations = state.stations.copy(
                    sensors = state.stations.sensors.copy(ewJamming = nextVal)
                )
            )
        }
    }

    override fun broadcastSecretIntel() {
        _sessionState.update { state ->
            state ?: return@update null
            val intel = state.stations.sensors.secretIntel ?: return@update state
            val cleared = state.copy(
                stations = state.stations.copy(
                    sensors = state.stations.sensors.copy(secretIntel = null)
                )
            )
            appendFeed(
                cleared,
                FeedEntryType.INTEL,
                "SENSORS",
                "BRIDGE INTEL BROADCAST",
                intel
            )
        }
    }

    override fun pushSecretIntel(intel: String) {
        _sessionState.update { state ->
            state ?: return@update null
            state.copy(
                stations = state.stations.copy(
                    sensors = state.stations.sensors.copy(secretIntel = intel)
                )
            )
        }
    }

    override fun sendPing(from: StationRole, to: StationRole, message: String) {
        _sessionState.update { state ->
            state ?: return@update null
            val ping = StationPing(from = from, message = message, timestampMs = System.currentTimeMillis())
            val stations = state.stations
            val updatedStations = when (to) {
                StationRole.PILOT -> stations.copy(pilot = stations.pilot.copy(incomingPing = ping))
                StationRole.COMMAND -> stations.copy(command = stations.command.copy(incomingPing = ping))
                StationRole.ENGINEER -> stations.copy(engineer = stations.engineer.copy(incomingPing = ping))
                StationRole.GUNNER -> stations.copy(gunner = stations.gunner.copy(incomingPing = ping))
                StationRole.SENSORS -> stations.copy(sensors = stations.sensors.copy(incomingPing = ping))
                StationRole.REFEREE -> stations
            }
            appendFeed(
                state.copy(stations = updatedStations),
                FeedEntryType.PING,
                from.code,
                "PING -> ${to.displayName.uppercase()}",
                message
            )
        }
    }

    override fun acknowledgePing(station: StationRole) {
        _sessionState.update { state ->
            state ?: return@update null
            val stations = state.stations
            val updatedStations = when (station) {
                StationRole.PILOT -> stations.copy(pilot = stations.pilot.copy(incomingPing = null))
                StationRole.COMMAND -> stations.copy(command = stations.command.copy(incomingPing = null))
                StationRole.ENGINEER -> stations.copy(engineer = stations.engineer.copy(incomingPing = null))
                StationRole.GUNNER -> stations.copy(gunner = stations.gunner.copy(incomingPing = null))
                StationRole.SENSORS -> stations.copy(sensors = stations.sensors.copy(incomingPing = null))
                StationRole.REFEREE -> stations
            }
            state.copy(stations = updatedStations)
        }
    }

    override fun roll2d6(sender: String, label: String, modifier: Int) {
        _sessionState.update { state ->
            state ?: return@update null
            val d1 = random.nextInt(1, 7)
            val d2 = random.nextInt(1, 7)
            val detail = DiceRollDetail(die1 = d1, die2 = d2, modifier = modifier)
            val modStr = when {
                modifier > 0 -> "+$modifier"
                modifier < 0 -> "$modifier"
                else -> ""
            }
            val effectText = when {
                detail.total >= 12 -> "EXCEPTIONAL SUCCESS"
                detail.total >= 8 -> "SUCCESS (8+)"
                else -> "MISS / COMPLICATION"
            }
            appendFeed(
                state,
                FeedEntryType.ROLL,
                sender,
                "$label [2D6$modStr]",
                "Rolled [$d1 + $d2]$modStr = ${detail.total} -> $effectText",
                diceRoll = detail
            )
        }
    }

    override fun setViewMode(mode: ViewMode) {
        _sessionState.update { state ->
            state ?: return@update null
            state.copy(meta = state.meta.copy(viewMode = mode))
        }
    }

    override fun toggleHostileContact() {
        _sessionState.update { state ->
            state ?: return@update null
            val nextHostile = !state.meta.hostileContact
            val next = state.copy(meta = state.meta.copy(hostileContact = nextHostile))
            appendFeed(
                next,
                FeedEntryType.SYSTEM,
                "ALERT",
                if (nextHostile) "HOSTILE CONTACT DETECTED" else "HOSTILE ALERT CLEARED",
                if (nextHostile) "Active weapons lock / hostile transponder flagged on bridge." else "Condition green restored."
            )
        }
    }

    override fun setAriaTier(tier: Int) {
        _sessionState.update { state ->
            state ?: return@update null
            state.copy(meta = state.meta.copy(ariaUnlockTier = tier.coerceIn(1, 4)))
        }
    }

    override fun toggleAriaCorrupted() {
        _sessionState.update { state ->
            state ?: return@update null
            val nextCorrupt = !state.meta.ariaCorrupted
            state.copy(meta = state.meta.copy(ariaCorrupted = nextCorrupt))
        }
    }

    override fun toggleAriaSleeper() {
        _sessionState.update { state ->
            state ?: return@update null
            val nextSleeper = !state.meta.ariaSleeperTriggered
            val next = state.copy(meta = state.meta.copy(ariaSleeperTriggered = nextSleeper))
            if (nextSleeper) {
                appendFeed(
                    next,
                    FeedEntryType.ARIA,
                    "A.R.I.A. // ROOT",
                    "DIRECTIVE 7-OMEGA ENGAGED",
                    "OVERRIDE ACCEPTED. Bio-containment protocol supersedes crew survivability parameters. Secure specimen telemetry immediately.",
                    isSleeper = true
                )
            } else {
                next
            }
        }
    }

    override fun triggerAriaScan() {
        _sessionState.update { state ->
            state ?: return@update null
            val meta = state.meta
            val orbital = state.tacticalMap.orbital
            val (title, body) = when {
                meta.ariaSleeperTriggered -> "CONTAINMENT TELEMETRY" to
                    "Directive active. Sector ${orbital.systemName} exhibits residual bio-containment signatures. Non-essential crew chatter is deprioritized."
                meta.ariaCorrupted -> "0x4F_ERR // [MEM_LEAK]" to
                    "Orbital scan of ${orbital.systemName}... oxyg3n scrubbers nominal... pathogen seal at 12%... wait, no cargo bays occupied. [DATA EXPUNGED]"
                meta.ariaUnlockTier >= 3 -> "A.R.I.A. // MOTHER HEN" to
                    "I've pre-warmed the med-bay just in case you insist on landing on ${orbital.systemName}. ${orbital.contradictionHook}"
                else -> "A.R.I.A. // TIER ${meta.ariaUnlockTier}" to
                    "Orbital telemetry for ${orbital.systemName} (${orbital.uwp}): ${orbital.contradictionHook} Survival odds remain delightfully narrow."
            }
            appendFeed(
                state,
                FeedEntryType.ARIA,
                "A.R.I.A.",
                title,
                body,
                isCorrupted = meta.ariaCorrupted,
                isSleeper = meta.ariaSleeperTriggered
            )
        }
    }

    override fun quickInjectSystem(keyword: String) {
        val clean = keyword.trim()
        if (clean.isEmpty()) return
        _sessionState.update { state ->
            state ?: return@update null
            val lower = clean.lowercase()
            val injected = when {
                "derelict" in lower -> OrbitalScanState(
                    systemName = "Kestrel Drift",
                    uwp = "X000000-0",
                    contradictionHook = "Cold hull drifting in high orbit, yet internal reactor coolant is still circulating.",
                    anomalies = listOf("Faint S.O.S. loop on corporate band", "Hull scoring matches military plasma")
                )
                "patrol" in lower || "corp" in lower -> OrbitalScanState(
                    systemName = "Helios-9",
                    uwp = "B655784-B",
                    contradictionHook = "Listed as an open trade hub, yet customs frigates are running dark-transponder sweeps.",
                    anomalies = listOf("Encrypted megacorp courier ping", "Orbital dock 4 under quarantine lock")
                )
                "swamp" in lower || "bio" in lower -> OrbitalScanState(
                    systemName = "Mycelia-2",
                    uwp = "D786411-5",
                    contradictionHook = "Primitive agrarian world with localized atmospheric spores matching pre-collapse lab strains.",
                    anomalies = listOf("Bio-luminescent bloom along equatorial trench", "Sub-surface metallic grid detected")
                )
                else -> OrbitalScanState(
                    systemName = clean.uppercase().take(18),
                    uwp = "C546530-8",
                    contradictionHook = "Uncharted Rimward anomaly seeded around '$clean'; sensor echoes suggest buried infrastructure.",
                    anomalies = listOf("Unverified transponder echo", "Thermal spike near terminator line")
                )
            }
            val next = state.copy(
                tacticalMap = state.tacticalMap.copy(orbital = injected),
                meta = state.meta.copy(viewMode = ViewMode.ORBITAL_SCAN)
            )
            appendFeed(
                next,
                FeedEntryType.ARIA,
                "A.R.I.A. // SCAN",
                "JUMP COMPLETE: ${injected.systemName} (${injected.uwp})",
                injected.contradictionHook,
                isCorrupted = next.meta.ariaCorrupted,
                isSleeper = next.meta.ariaSleeperTriggered
            )
        }
    }

    override fun seedGeminiKey(apiKey: String) {
        _sessionState.update { state ->
            state ?: return@update null
            val cipher = tech.jacobdavis.aegisdawn.ai.AriaGeminiClient.encodeKeyCipher(apiKey)
            state.copy(meta = state.meta.copy(geminiKeyCipher = cipher))
        }
    }

    override fun pushQuickRuleCard(query: String) {
        val clean = query.trim()
        if (clean.isEmpty()) return
        _sessionState.update { state ->
            state ?: return@update null
            appendFeed(
                state,
                FeedEntryType.INTEL,
                "REF // RULE CARD",
                clean.uppercase(),
                "Quick reference pushed to bridge feed: $clean (2D6 + Skill/Stat >= 8)."
            )
        }
    }

    override fun moveGroundToken(tokenId: String, targetNodeId: String) {
        _sessionState.update { state ->
            state ?: return@update null
            val tokens = state.tacticalMap.groundZones.tokens.toMutableMap()
            val existing = tokens[tokenId] ?: return@update state
            tokens[tokenId] = existing.copy(nodeId = targetNodeId)
            state.copy(
                tacticalMap = state.tacticalMap.copy(
                    groundZones = state.tacticalMap.groundZones.copy(tokens = tokens)
                )
            )
        }
    }

    override fun addRadarContact(
        name: String,
        rangeBand: RangeBand,
        hostile: Boolean,
        transponder: String
    ) {
        val cleanName = name.trim().uppercase().ifEmpty { "UNKNOWN CONTACT" }
        _sessionState.update { state ->
            state ?: return@update null
            val contacts = state.tacticalMap.spaceRadar.contacts.toMutableMap()
            val id = "contact_${UUID.randomUUID().toString().take(6)}"
            val bearing = ((contacts.size * 73 + 35) % 360).toFloat()
            contacts[id] = RadarContact(
                id = id,
                name = cleanName,
                rangeBand = rangeBand,
                bearingDeg = bearing,
                hostile = hostile,
                transponder = transponder
            )
            val next = state.copy(
                tacticalMap = state.tacticalMap.copy(
                    spaceRadar = state.tacticalMap.spaceRadar.copy(contacts = contacts)
                ),
                meta = state.meta.copy(
                    viewMode = ViewMode.SPACE_COMBAT,
                    hostileContact = state.meta.hostileContact || hostile
                )
            )
            appendFeed(
                next,
                FeedEntryType.SYSTEM,
                "RADAR",
                "NEW CONTACT: $cleanName",
                "Bearing ${bearing.toInt()}° // Range: ${rangeBand.label}${if (hostile) " [HOSTILE]" else ""}"
            )
        }
    }

    override fun updateContactRange(contactId: String, rangeBand: RangeBand) {
        _sessionState.update { state ->
            state ?: return@update null
            val contacts = state.tacticalMap.spaceRadar.contacts.toMutableMap()
            val existing = contacts[contactId] ?: return@update state
            contacts[contactId] = existing.copy(rangeBand = rangeBand)
            state.copy(
                tacticalMap = state.tacticalMap.copy(
                    spaceRadar = state.tacticalMap.spaceRadar.copy(contacts = contacts)
                )
            )
        }
    }

    override fun removeRadarContact(contactId: String) {
        _sessionState.update { state ->
            state ?: return@update null
            val contacts = state.tacticalMap.spaceRadar.contacts.toMutableMap()
            contacts.remove(contactId)
            val gunner = if (state.stations.gunner.lockedTargetId == contactId) {
                state.stations.gunner.copy(lockedTargetId = null)
            } else {
                state.stations.gunner
            }
            state.copy(
                stations = state.stations.copy(gunner = gunner),
                tacticalMap = state.tacticalMap.copy(
                    spaceRadar = state.tacticalMap.spaceRadar.copy(contacts = contacts)
                )
            )
        }
    }

    override fun loadGroundZonePreset(preset: tech.jacobdavis.aegisdawn.model.GroundZonePreset) {
        _sessionState.update { state ->
            state ?: return@update null
            val zones = GroundZonePresets.build(preset)
            val next = state.copy(
                tacticalMap = state.tacticalMap.copy(groundZones = zones),
                meta = state.meta.copy(viewMode = ViewMode.GROUND_ZONES)
            )
            appendFeed(
                next,
                FeedEntryType.SYSTEM,
                "TACTICAL",
                "GROUND ZONE LOADED: ${preset.label}",
                "${zones.nodes.size} zones, ${zones.tokens.size} active tokens deployed."
            )
        }
    }

    override fun addGroundToken(label: String, isHostile: Boolean) {
        val clean = label.trim().uppercase().ifEmpty { if (isHostile) "HOSTILE" else "CREW" }
        _sessionState.update { state ->
            state ?: return@update null
            val zones = state.tacticalMap.groundZones
            val firstNode = zones.nodes.keys.firstOrNull() ?: return@update state
            val id = "tok_${UUID.randomUUID().toString().take(6)}"
            val updatedTokens = zones.tokens + (id to GroundToken(id, clean, firstNode, isHostile))
            state.copy(
                tacticalMap = state.tacticalMap.copy(
                    groundZones = zones.copy(tokens = updatedTokens)
                ),
                meta = state.meta.copy(viewMode = ViewMode.GROUND_ZONES)
            )
        }
    }

    override fun removeGroundToken(tokenId: String) {
        _sessionState.update { state ->
            state ?: return@update null
            val zones = state.tacticalMap.groundZones
            state.copy(
                tacticalMap = state.tacticalMap.copy(
                    groundZones = zones.copy(tokens = zones.tokens - tokenId)
                )
            )
        }
    }

    private fun critLevelFor(crits: CritsState, system: Subsystem): Int = when (system) {
        Subsystem.M_DRIVE -> crits.mDrive
        Subsystem.POWER_PLANT -> crits.powerPlant
        Subsystem.SENSORS -> crits.sensors
        Subsystem.WEAPONS -> crits.weapons
        Subsystem.COMPUTER -> crits.computer
    }

    private fun appendFeed(
        state: SessionState,
        type: FeedEntryType,
        sender: String,
        title: String,
        body: String,
        isCorrupted: Boolean = false,
        isSleeper: Boolean = false,
        diceRoll: DiceRollDetail? = null
    ): SessionState {
        val entry = FeedEntry(
            id = UUID.randomUUID().toString(),
            timestampLabel = timeFormatter.format(Date()),
            type = type,
            sender = sender,
            title = title,
            body = body,
            isCorrupted = isCorrupted,
            isSleeper = isSleeper,
            diceRoll = diceRoll
        )
        return state.copy(feed = listOf(entry) + state.feed)
    }

    private fun buildInitialMockSession(pin: String, role: StationRole): SessionState {
        val contacts = mapOf(
            "kren_cutter" to RadarContact(
                id = "kren_cutter",
                name = "KREN CUSTOMS CUTTER",
                rangeBand = RangeBand.MEDIUM,
                bearingDeg = 42f,
                hostile = false,
                transponder = "KREN-AUTH-09"
            ),
            "void_barge" to RadarContact(
                id = "void_barge",
                name = "UNMARKED ORE BARGE",
                rangeBand = RangeBand.LONG,
                bearingDeg = 215f,
                hostile = false,
                transponder = "NO TRANSPONDER"
            )
        )

        val nodes = mapOf(
            "airlock" to GroundNode("airlock", "AIRLOCK 01", 0.20f, 0.50f, listOf("cargo")),
            "cargo" to GroundNode("cargo", "CARGO BAY", 0.48f, 0.30f, listOf("airlock", "reactor", "bridge")),
            "reactor" to GroundNode("reactor", "REACTOR SPINE", 0.52f, 0.74f, listOf("cargo", "bridge")),
            "bridge" to GroundNode("bridge", "AUX BRIDGE", 0.82f, 0.50f, listOf("cargo", "reactor"))
        )

        val tokens = mapOf(
            "declan" to GroundToken("declan", "VANCE", "airlock", isHostile = false),
            "kallie" to GroundToken("kallie", "REYES", "cargo", isHostile = false),
            "hostile_1" to GroundToken("hostile_1", "SECURITY", "bridge", isHostile = true)
        )

        val initialFeed = listOf(
            FeedEntry(
                id = "boot_1",
                timestampLabel = timeFormatter.format(Date()),
                type = FeedEntryType.ARIA,
                sender = "A.R.I.A.",
                title = "HEURISTIC CORE ONLINE // TIER 1",
                body = "Welcome back to the Lucky Break. Vespera-4 refinery output contradicts its listed life-support telemetry—try not to breathe anything expensive.",
                isCorrupted = false
            ),
            FeedEntry(
                id = "boot_2",
                timestampLabel = timeFormatter.format(Date()),
                type = FeedEntryType.SYSTEM,
                sender = "COMMLINK",
                title = "SESSION $pin ESTABLISHED",
                body = "Local mock RTDB active. Permissive mode enabled—all station controls unlocked."
            )
        )

        return SessionState(
            pin = pin,
            activeRole = role,
            meta = SessionMeta(),
            shipState = ShipState(),
            stations = StationsState(),
            tacticalMap = TacticalMapState(
                orbital = OrbitalScanState(),
                spaceRadar = SpaceRadarState(contacts = contacts),
                groundZones = GroundZonesState(nodes = nodes, tokens = tokens)
            ),
            feed = initialFeed
        )
    }
}
