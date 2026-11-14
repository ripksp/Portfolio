package tech.jakedavis.aegisdawn.data

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.DatabaseReference
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.MutableData
import com.google.firebase.database.Transaction
import com.google.firebase.database.ValueEventListener
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import tech.jakedavis.aegisdawn.model.CommandStation
import tech.jakedavis.aegisdawn.model.CritsState
import tech.jakedavis.aegisdawn.model.DiceRollDetail
import tech.jakedavis.aegisdawn.model.EngineerStation
import tech.jakedavis.aegisdawn.model.FeedEntry
import tech.jakedavis.aegisdawn.model.FeedEntryType
import tech.jakedavis.aegisdawn.model.GroundNode
import tech.jakedavis.aegisdawn.model.GroundToken
import tech.jakedavis.aegisdawn.model.GroundZonesState
import tech.jakedavis.aegisdawn.model.GunnerStation
import tech.jakedavis.aegisdawn.model.HullState
import tech.jakedavis.aegisdawn.model.OrbitalScanState
import tech.jakedavis.aegisdawn.model.PilotStation
import tech.jakedavis.aegisdawn.model.PowerAllocation
import tech.jakedavis.aegisdawn.model.PowerState
import tech.jakedavis.aegisdawn.model.RadarContact
import tech.jakedavis.aegisdawn.model.RangeBand
import tech.jakedavis.aegisdawn.model.SensorsStation
import tech.jakedavis.aegisdawn.model.SessionMeta
import tech.jakedavis.aegisdawn.model.SessionState
import tech.jakedavis.aegisdawn.model.ShipState
import tech.jakedavis.aegisdawn.model.SpaceRadarState
import tech.jakedavis.aegisdawn.model.StationPing
import tech.jakedavis.aegisdawn.model.StationRole
import tech.jakedavis.aegisdawn.model.StationsState
import tech.jakedavis.aegisdawn.model.Subsystem
import tech.jakedavis.aegisdawn.model.TacticalMapState
import tech.jakedavis.aegisdawn.model.ThrustPoolState
import tech.jakedavis.aegisdawn.model.ViewMode
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.random.Random

class ShipCombatRepository(
    private val auth: FirebaseAuth,
    private val database: FirebaseDatabase,
    private val prefs: SessionPreferences? = null,
    private val random: Random = Random.Default
) : SessionRepository {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val _sessionState = MutableStateFlow<SessionState?>(null)
    override val sessionState: StateFlow<SessionState?> = _sessionState.asStateFlow()

    private val timeFormatter = SimpleDateFormat("HH:mm:ss", Locale.US)

    private var activePin: String? = null
    private var activeRole: StationRole = StationRole.PILOT
    private var listenerJob: Job? = null

    private fun sessionRef(pin: String): DatabaseReference =
        database.reference.child("sessions").child(pin)

    override fun connect(pin: String, role: StationRole) {
        val normalizedPin = pin.trim().uppercase().take(4).ifEmpty { "AEGS" }
        activePin = normalizedPin
        activeRole = role
        prefs?.save(normalizedPin, role)

        listenerJob?.cancel()
        listenerJob = scope.launch {
            val uid = ensureAnonymousUid()
            val ref = sessionRef(normalizedPin)
            ref.keepSynced(true)

            seedSessionIfMissing(ref, normalizedPin, uid, role)
            claimStationSeat(ref, uid, role)

            observeSessionSnapshot(ref).collect { snapshot ->
                _sessionState.value = mapSnapshotToSessionState(snapshot, normalizedPin, role)
            }
        }
    }

    override fun disconnect() {
        listenerJob?.cancel()
        listenerJob = null
        activePin?.let { pin ->
            sessionRef(pin).keepSynced(false)
        }
        activePin = null
        prefs?.clear()
        _sessionState.value = null
    }

    private suspend fun ensureAnonymousUid(): String {
        val current = auth.currentUser
        if (current != null) return current.uid
        val result = auth.signInAnonymously().await()
        return result.user?.uid ?: "anon_local"
    }

    private fun observeSessionSnapshot(ref: DatabaseReference): Flow<DataSnapshot> = callbackFlow {
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                trySend(snapshot)
            }

            override fun onCancelled(error: DatabaseError) {
                // Keep flow open; offline cache continues serving local state
            }
        }
        ref.addValueEventListener(listener)
        awaitClose { ref.removeEventListener(listener) }
    }

    private suspend fun seedSessionIfMissing(
        ref: DatabaseReference,
        pin: String,
        uid: String,
        role: StationRole
    ) {
        val existing = runCatching { ref.child("meta").get().await() }.getOrNull()
        if (existing != null && existing.exists()) return

        val initialData = mapOf(
            "meta" to mapOf(
                "viewMode" to ViewMode.ORBITAL_SCAN.name,
                "hostileContact" to false,
                "geminiKeyCipher" to "",
                "ariaUnlockTier" to 1,
                "ariaCorrupted" to false,
                "ariaSleeperTriggered" to false,
                "refereeUid" to if (role == StationRole.REFEREE) uid else null
            ),
            "shipState" to mapOf(
                "hull" to mapOf("current" to 80, "max" to 80),
                "power" to mapOf(
                    "available" to 12,
                    "allocated" to mapOf("mDrive" to 4, "weapons" to 4, "sensors" to 4)
                ),
                "thrustPool" to mapOf("total" to 4, "remaining" to 4),
                "crits" to mapOf(
                    "mDrive" to 0,
                    "powerPlant" to 0,
                    "sensors" to 0,
                    "weapons" to 0,
                    "computer" to 0
                )
            ),
            "stations" to mapOf(
                "pilot" to mapOf("evadeActive" to false),
                "command" to mapOf<String, Any>(),
                "engineer" to mapOf<String, Any>(),
                "gunner" to mapOf<String, Any>(),
                "sensors" to mapOf("ewJamming" to false)
            ),
            "tacticalMap" to mapOf(
                "orbital" to mapOf(
                    "systemName" to "Vespera-4",
                    "uwp" to "C544632-7",
                    "contradictionHook" to "High-output orbital refinery with zero breathable air and rationed water.",
                    "anomalies" to listOf(
                        "Unregistered beacon pulsing on 142.8 MHz",
                        "Refinery flare signature exceeds listed TL-7 output"
                    )
                ),
                "spaceRadar" to mapOf(
                    "contacts" to mapOf(
                        "kren_cutter" to mapOf(
                            "name" to "KREN CUSTOMS CUTTER",
                            "rangeBand" to RangeBand.MEDIUM.name,
                            "bearingDeg" to 42.0,
                            "hostile" to false,
                            "transponder" to "KREN-AUTH-09"
                        ),
                        "void_barge" to mapOf(
                            "name" to "UNMARKED ORE BARGE",
                            "rangeBand" to RangeBand.LONG.name,
                            "bearingDeg" to 215.0,
                            "hostile" to false,
                            "transponder" to "NO TRANSPONDER"
                        )
                    )
                ),
                "groundZones" to mapOf(
                    "nodes" to mapOf(
                        "airlock" to mapOf("label" to "AIRLOCK 01", "xNorm" to 0.20, "yNorm" to 0.50, "connectedTo" to listOf("cargo")),
                        "cargo" to mapOf("label" to "CARGO BAY", "xNorm" to 0.48, "yNorm" to 0.30, "connectedTo" to listOf("airlock", "reactor", "bridge")),
                        "reactor" to mapOf("label" to "REACTOR SPINE", "xNorm" to 0.52, "yNorm" to 0.74, "connectedTo" to listOf("cargo", "bridge")),
                        "bridge" to mapOf("label" to "AUX BRIDGE", "xNorm" to 0.82, "yNorm" to 0.50, "connectedTo" to listOf("cargo", "reactor"))
                    ),
                    "tokens" to mapOf(
                        "declan" to mapOf("label" to "VANCE", "nodeId" to "airlock", "isHostile" to false),
                        "kallie" to mapOf("label" to "REYES", "nodeId" to "cargo", "isHostile" to false),
                        "hostile_1" to mapOf("label" to "SECURITY", "nodeId" to "bridge", "isHostile" to true)
                    )
                )
            )
        )

        ref.setValue(initialData)
        pushFeedEntry(
            ref = ref,
            type = FeedEntryType.ARIA,
            sender = "A.R.I.A.",
            title = "HEURISTIC CORE ONLINE // TIER 1",
            body = "Welcome back to the Lucky Break. Vespera-4 refinery output contradicts its listed life-support telemetry—try not to breathe anything expensive."
        )
    }

    private fun claimStationSeat(ref: DatabaseReference, uid: String, role: StationRole) {
        if (role == StationRole.REFEREE) {
            ref.child("meta/refereeUid").setValue(uid)
            return
        }
        ref.child("stations").child(role.stationKey()).child("assignedUid").setValue(uid)
    }

    override fun adjustHull(delta: Int) {
        val pin = activePin ?: return
        val state = _sessionState.value
        val maxHull = state?.shipState?.hull?.max ?: 80
        val prevHull = state?.shipState?.hull?.current ?: maxHull
        val ref = sessionRef(pin)
        runIntTransaction(
            ref = ref.child("shipState/hull/current"),
            delta = delta,
            min = 0,
            max = maxHull
        ) { newHull ->
            val crossedHalf = prevHull >= maxHull / 2 && newHull in 1 until (maxHull / 2)
            val hitZero = prevHull > 0 && newHull == 0
            if (crossedHalf || hitZero) {
                val meta = _sessionState.value?.meta ?: SessionMeta()
                scope.launch {
                    val aiText = tech.jakedavis.aegisdawn.ai.AriaGeminiClient.generateTelemetry(
                        meta = meta,
                        eventType = if (hitZero) "HULL_BREACH" else "HULL_CRITICAL_50",
                        eventPayload = mapOf("hullCurrent" to newHull, "hullMax" to maxHull)
                    )
                    val fallback = if (hitZero) {
                        "Bulkhead integrity at zero. Routing auxiliary power to escape rails; your statistical survival odds just became decorative."
                    } else {
                        "Hull integrity below 50% ($newHull/$maxHull). Structural groaning suggests you stop letting people shoot at us."
                    }
                    pushFeedEntry(
                        ref = ref,
                        type = FeedEntryType.ARIA,
                        sender = "A.R.I.A.",
                        title = if (hitZero) "HULL BREACH // SURVIVAL PROTOCOL" else "HULL WARNING // < 50%",
                        body = aiText ?: fallback,
                        isCorrupted = meta.ariaCorrupted,
                        isSleeper = meta.ariaSleeperTriggered
                    )
                }
            }
        }
    }

    override fun adjustThrust(delta: Int) {
        val pin = activePin ?: return
        val maxThrust = _sessionState.value?.shipState?.thrustPool?.total ?: 4
        runIntTransaction(
            ref = sessionRef(pin).child("shipState/thrustPool/remaining"),
            delta = delta,
            min = 0,
            max = maxThrust
        )
    }

    override fun adjustPowerAvailable(delta: Int) {
        val pin = activePin ?: return
        runIntTransaction(
            ref = sessionRef(pin).child("shipState/power/available"),
            delta = delta,
            min = 0,
            max = 24
        )
    }

    override fun allocatePower(system: Subsystem, delta: Int) {
        val pin = activePin ?: return
        val childName = when (system) {
            Subsystem.M_DRIVE -> "mDrive"
            Subsystem.WEAPONS -> "weapons"
            Subsystem.SENSORS -> "sensors"
            else -> return
        }
        runIntTransaction(
            ref = sessionRef(pin).child("shipState/power/allocated").child(childName),
            delta = delta,
            min = 0,
            max = 12
        )
    }

    override fun adjustCrit(system: Subsystem, delta: Int) {
        val pin = activePin ?: return
        val ref = sessionRef(pin)
        val childName = when (system) {
            Subsystem.M_DRIVE -> "mDrive"
            Subsystem.POWER_PLANT -> "powerPlant"
            Subsystem.SENSORS -> "sensors"
            Subsystem.WEAPONS -> "weapons"
            Subsystem.COMPUTER -> "computer"
        }
        runIntTransaction(
            ref = ref.child("shipState/crits").child(childName),
            delta = delta,
            min = 0,
            max = 3
        ) { newLevel ->
            if (system == Subsystem.COMPUTER && newLevel > 0) {
                ref.child("meta/ariaCorrupted").setValue(true)
            }
            if (delta > 0) {
                pushFeedEntry(
                    ref = ref,
                    type = FeedEntryType.SYSTEM,
                    sender = "DAMAGE CTRL",
                    title = "CRIT: ${system.label}",
                    body = "Severity increased to $newLevel.",
                    isCorrupted = system == Subsystem.COMPUTER && newLevel > 0
                )
            }
        }
    }

    override fun toggleEvade() {
        val pin = activePin ?: return
        val current = _sessionState.value?.stations?.pilot?.evadeActive ?: false
        sessionRef(pin).child("stations/pilot/evadeActive").setValue(!current)
    }

    override fun setCommandBoon(target: StationRole?) {
        val pin = activePin ?: return
        sessionRef(pin).child("stations/command/boonTarget").setValue(target?.name)
    }

    override fun setEngineerOverdrive(system: Subsystem?) {
        val pin = activePin ?: return
        sessionRef(pin).child("stations/engineer/overdriveSystem").setValue(system?.name)
    }

    override fun setGunnerTarget(contactId: String?) {
        val pin = activePin ?: return
        sessionRef(pin).child("stations/gunner/lockedTargetId").setValue(contactId)
    }

    override fun toggleEwJamming() {
        val pin = activePin ?: return
        val current = _sessionState.value?.stations?.sensors?.ewJamming ?: false
        sessionRef(pin).child("stations/sensors/ewJamming").setValue(!current)
    }

    override fun broadcastSecretIntel() {
        val pin = activePin ?: return
        val intel = _sessionState.value?.stations?.sensors?.secretIntel ?: return
        val ref = sessionRef(pin)
        ref.child("stations/sensors/secretIntel").removeValue()
        pushFeedEntry(
            ref = ref,
            type = FeedEntryType.INTEL,
            sender = "SENSORS",
            title = "BRIDGE INTEL BROADCAST",
            body = intel
        )
    }

    override fun pushSecretIntel(intel: String) {
        val pin = activePin ?: return
        sessionRef(pin).child("stations/sensors/secretIntel").setValue(intel)
    }

    override fun sendPing(from: StationRole, to: StationRole, message: String) {
        val pin = activePin ?: return
        if (to == StationRole.REFEREE) return
        val ref = sessionRef(pin)
        ref.child("stations").child(to.stationKey()).child("incomingPing").setValue(
            mapOf(
                "from" to from.name,
                "message" to message,
                "timestampMs" to System.currentTimeMillis()
            )
        )
        pushFeedEntry(
            ref = ref,
            type = FeedEntryType.PING,
            sender = from.code,
            title = "PING -> ${to.displayName.uppercase()}",
            body = message
        )
    }

    override fun acknowledgePing(station: StationRole) {
        val pin = activePin ?: return
        if (station == StationRole.REFEREE) return
        sessionRef(pin).child("stations").child(station.stationKey()).child("incomingPing").removeValue()
    }

    override fun roll2d6(sender: String, label: String, modifier: Int) {
        val pin = activePin ?: return
        val d1 = random.nextInt(1, 7)
        val d2 = random.nextInt(1, 7)
        val total = d1 + d2 + modifier
        val modStr = when {
            modifier > 0 -> "+$modifier"
            modifier < 0 -> "$modifier"
            else -> ""
        }
        val effectText = when {
            total >= 12 -> "EXCEPTIONAL SUCCESS"
            total >= 8 -> "SUCCESS (8+)"
            else -> "MISS / COMPLICATION"
        }
        pushFeedEntry(
            ref = sessionRef(pin),
            type = FeedEntryType.ROLL,
            sender = sender,
            title = "$label [2D6$modStr]",
            body = "Rolled [$d1 + $d2]$modStr = $total -> $effectText",
            diceRoll = DiceRollDetail(d1, d2, modifier)
        )
    }

    override fun setViewMode(mode: ViewMode) {
        val pin = activePin ?: return
        sessionRef(pin).child("meta/viewMode").setValue(mode.name)
    }

    override fun toggleHostileContact() {
        val pin = activePin ?: return
        val current = _sessionState.value?.meta?.hostileContact ?: false
        val next = !current
        val ref = sessionRef(pin)
        ref.child("meta/hostileContact").setValue(next)
        pushFeedEntry(
            ref = ref,
            type = FeedEntryType.SYSTEM,
            sender = "ALERT",
            title = if (next) "HOSTILE CONTACT DETECTED" else "HOSTILE ALERT CLEARED",
            body = if (next) "Active weapons lock / hostile transponder flagged on bridge." else "Condition green restored."
        )
    }

    override fun setAriaTier(tier: Int) {
        val pin = activePin ?: return
        sessionRef(pin).child("meta/ariaUnlockTier").setValue(tier.coerceIn(1, 4))
    }

    override fun toggleAriaCorrupted() {
        val pin = activePin ?: return
        val current = _sessionState.value?.meta?.ariaCorrupted ?: false
        sessionRef(pin).child("meta/ariaCorrupted").setValue(!current)
    }

    override fun toggleAriaSleeper() {
        val pin = activePin ?: return
        val current = _sessionState.value?.meta?.ariaSleeperTriggered ?: false
        val next = !current
        val ref = sessionRef(pin)
        ref.child("meta/ariaSleeperTriggered").setValue(next)
        if (next) {
            pushFeedEntry(
                ref = ref,
                type = FeedEntryType.ARIA,
                sender = "A.R.I.A. // ROOT",
                title = "DIRECTIVE 7-OMEGA ENGAGED",
                body = "OVERRIDE ACCEPTED. Bio-containment protocol supersedes crew survivability parameters. Secure specimen telemetry immediately.",
                isSleeper = true
            )
        }
    }

    override fun triggerAriaScan() {
        val pin = activePin ?: return
        val state = _sessionState.value ?: return
        val meta = state.meta
        val orbital = state.tacticalMap.orbital
        val ref = sessionRef(pin)

        scope.launch {
            val aiText = tech.jakedavis.aegisdawn.ai.AriaGeminiClient.generateTelemetry(
                meta = meta,
                eventType = "ORBITAL_SCAN",
                eventPayload = mapOf(
                    "systemName" to orbital.systemName,
                    "uwp" to orbital.uwp,
                    "contradictionHook" to orbital.contradictionHook,
                    "hullCurrent" to state.shipState.hull.current,
                    "hullMax" to state.shipState.hull.max
                )
            )
            val (title, fallback) = when {
                meta.ariaSleeperTriggered -> "CONTAINMENT TELEMETRY" to
                    "Directive active. Sector ${orbital.systemName} exhibits residual bio-containment signatures. Non-essential crew chatter is deprioritized."
                meta.ariaCorrupted -> "0x4F_ERR // [MEM_LEAK]" to
                    "Orbital scan of ${orbital.systemName}... oxyg3n scrubbers nominal... pathogen seal at 12%... wait, no cargo bays occupied. [DATA EXPUNGED]"
                meta.ariaUnlockTier >= 3 -> "A.R.I.A. // MOTHER HEN" to
                    "I've pre-warmed the med-bay just in case you insist on landing on ${orbital.systemName}. ${orbital.contradictionHook}"
                else -> "A.R.I.A. // TIER ${meta.ariaUnlockTier}" to
                    "Orbital telemetry for ${orbital.systemName} (${orbital.uwp}): ${orbital.contradictionHook} Survival odds remain delightfully narrow."
            }
            pushFeedEntry(
                ref = ref,
                type = FeedEntryType.ARIA,
                sender = "A.R.I.A.",
                title = title,
                body = aiText ?: fallback,
                isCorrupted = meta.ariaCorrupted,
                isSleeper = meta.ariaSleeperTriggered
            )
        }
    }

    override fun quickInjectSystem(keyword: String) {
        val pin = activePin ?: return
        val clean = keyword.trim()
        if (clean.isEmpty()) return
        val ref = sessionRef(pin)
        val meta = _sessionState.value?.meta ?: SessionMeta()

        scope.launch {
            val aiInject = tech.jakedavis.aegisdawn.ai.AriaGeminiClient.generateQuickInject(meta, clean)
            val lower = clean.lowercase()
            val fallbackOrbital = when {
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
            val injected = aiInject?.orbital ?: fallbackOrbital
            val ticker = aiInject?.ticker ?: injected.contradictionHook

            ref.child("tacticalMap/orbital").setValue(
                mapOf(
                    "systemName" to injected.systemName,
                    "uwp" to injected.uwp,
                    "contradictionHook" to injected.contradictionHook,
                    "anomalies" to injected.anomalies
                )
            )
            ref.child("meta/viewMode").setValue(ViewMode.ORBITAL_SCAN.name)
            pushFeedEntry(
                ref = ref,
                type = FeedEntryType.ARIA,
                sender = "A.R.I.A. // SCAN",
                title = "JUMP COMPLETE: ${injected.systemName} (${injected.uwp})",
                body = ticker,
                isCorrupted = meta.ariaCorrupted,
                isSleeper = meta.ariaSleeperTriggered
            )
        }
    }

    override fun seedGeminiKey(apiKey: String) {
        val pin = activePin ?: return
        val cipher = tech.jakedavis.aegisdawn.ai.AriaGeminiClient.encodeKeyCipher(apiKey)
        sessionRef(pin).child("meta/geminiKeyCipher").setValue(cipher)
    }

    override fun pushQuickRuleCard(query: String) {
        val pin = activePin ?: return
        val clean = query.trim()
        if (clean.isEmpty()) return
        val ref = sessionRef(pin)
        val meta = _sessionState.value?.meta ?: SessionMeta()

        scope.launch {
            val aiText = tech.jakedavis.aegisdawn.ai.AriaGeminiClient.generateTelemetry(
                meta = meta,
                eventType = "RULE_CARD_LOOKUP",
                eventPayload = mapOf("query" to clean)
            )
            pushFeedEntry(
                ref = ref,
                type = FeedEntryType.INTEL,
                sender = "REF // RULE CARD",
                title = clean.uppercase(),
                body = aiText ?: "Quick reference pushed to bridge feed: $clean (2D6 + Skill/Stat >= 8)."
            )
        }
    }

    override fun moveGroundToken(tokenId: String, targetNodeId: String) {
        val pin = activePin ?: return
        sessionRef(pin).child("tacticalMap/groundZones/tokens").child(tokenId).child("nodeId")
            .setValue(targetNodeId)
    }

    override fun addRadarContact(
        name: String,
        rangeBand: RangeBand,
        hostile: Boolean,
        transponder: String
    ) {
        val pin = activePin ?: return
        val cleanName = name.trim().uppercase().ifEmpty { "UNKNOWN CONTACT" }
        val ref = sessionRef(pin)
        val key = ref.child("tacticalMap/spaceRadar/contacts").push().key ?: return
        val count = _sessionState.value?.tacticalMap?.spaceRadar?.contacts?.size ?: 0
        val bearing = ((count * 73 + 35) % 360).toDouble()
        ref.child("tacticalMap/spaceRadar/contacts").child(key).setValue(
            mapOf(
                "name" to cleanName,
                "rangeBand" to rangeBand.name,
                "bearingDeg" to bearing,
                "hostile" to hostile,
                "transponder" to transponder
            )
        )
        ref.child("meta/viewMode").setValue(ViewMode.SPACE_COMBAT.name)
        if (hostile) {
            ref.child("meta/hostileContact").setValue(true)
        }
        pushFeedEntry(
            ref = ref,
            type = FeedEntryType.SYSTEM,
            sender = "RADAR",
            title = "NEW CONTACT: $cleanName",
            body = "Bearing ${bearing.toInt()}° // Range: ${rangeBand.label}${if (hostile) " [HOSTILE]" else ""}"
        )
    }

    override fun updateContactRange(contactId: String, rangeBand: RangeBand) {
        val pin = activePin ?: return
        sessionRef(pin).child("tacticalMap/spaceRadar/contacts").child(contactId)
            .child("rangeBand").setValue(rangeBand.name)
    }

    override fun removeRadarContact(contactId: String) {
        val pin = activePin ?: return
        val ref = sessionRef(pin)
        ref.child("tacticalMap/spaceRadar/contacts").child(contactId).removeValue()
        if (_sessionState.value?.stations?.gunner?.lockedTargetId == contactId) {
            ref.child("stations/gunner/lockedTargetId").removeValue()
        }
    }

    override fun loadGroundZonePreset(preset: tech.jakedavis.aegisdawn.model.GroundZonePreset) {
        val pin = activePin ?: return
        val ref = sessionRef(pin)
        val zones = GroundZonePresets.build(preset)
        val nodesMap = zones.nodes.mapValues { (_, n) ->
            mapOf(
                "label" to n.label,
                "xNorm" to n.xNorm.toDouble(),
                "yNorm" to n.yNorm.toDouble(),
                "connectedTo" to n.connectedTo
            )
        }
        val tokensMap = zones.tokens.mapValues { (_, t) ->
            mapOf(
                "label" to t.label,
                "nodeId" to t.nodeId,
                "isHostile" to t.isHostile
            )
        }
        ref.child("tacticalMap/groundZones").setValue(
            mapOf("nodes" to nodesMap, "tokens" to tokensMap)
        )
        ref.child("meta/viewMode").setValue(ViewMode.GROUND_ZONES.name)
        pushFeedEntry(
            ref = ref,
            type = FeedEntryType.SYSTEM,
            sender = "TACTICAL",
            title = "GROUND ZONE LOADED: ${preset.label}",
            body = "${zones.nodes.size} zones, ${zones.tokens.size} active tokens deployed."
        )
    }

    override fun addGroundToken(label: String, isHostile: Boolean) {
        val pin = activePin ?: return
        val clean = label.trim().uppercase().ifEmpty { if (isHostile) "HOSTILE" else "CREW" }
        val firstNode = _sessionState.value?.tacticalMap?.groundZones?.nodes?.keys?.firstOrNull() ?: return
        val ref = sessionRef(pin)
        val key = ref.child("tacticalMap/groundZones/tokens").push().key ?: return
        ref.child("tacticalMap/groundZones/tokens").child(key).setValue(
            mapOf("label" to clean, "nodeId" to firstNode, "isHostile" to isHostile)
        )
        ref.child("meta/viewMode").setValue(ViewMode.GROUND_ZONES.name)
    }

    override fun removeGroundToken(tokenId: String) {
        val pin = activePin ?: return
        sessionRef(pin).child("tacticalMap/groundZones/tokens").child(tokenId).removeValue()
    }

    private fun runIntTransaction(
        ref: DatabaseReference,
        delta: Int,
        min: Int,
        max: Int,
        onComplete: ((Int) -> Unit)? = null
    ) {
        ref.runTransaction(object : Transaction.Handler {
            override fun doTransaction(currentData: MutableData): Transaction.Result {
                val currentVal = (currentData.getValue(Long::class.java) ?: 0L).toInt()
                val nextVal = (currentVal + delta).coerceIn(min, max)
                currentData.value = nextVal
                return Transaction.success(currentData)
            }

            override fun onComplete(
                error: DatabaseError?,
                committed: Boolean,
                currentData: DataSnapshot?
            ) {
                if (committed && error == null) {
                    val finalVal = (currentData?.getValue(Long::class.java) ?: 0L).toInt()
                    onComplete?.invoke(finalVal)
                }
            }
        })
    }

    private fun pushFeedEntry(
        ref: DatabaseReference,
        type: FeedEntryType,
        sender: String,
        title: String,
        body: String,
        isCorrupted: Boolean = false,
        isSleeper: Boolean = false,
        diceRoll: DiceRollDetail? = null
    ) {
        val key = ref.child("feed").push().key ?: return
        val payload = mutableMapOf<String, Any>(
            "timestampLabel" to timeFormatter.format(Date()),
            "timestampMs" to System.currentTimeMillis(),
            "type" to type.name,
            "sender" to sender,
            "title" to title,
            "body" to body,
            "isCorrupted" to isCorrupted,
            "isSleeper" to isSleeper
        )
        if (diceRoll != null) {
            payload["diceRoll"] = mapOf(
                "die1" to diceRoll.die1,
                "die2" to diceRoll.die2,
                "modifier" to diceRoll.modifier
            )
        }
        ref.child("feed").child(key).setValue(payload)
    }

    private fun mapSnapshotToSessionState(
        snapshot: DataSnapshot,
        pin: String,
        role: StationRole
    ): SessionState {
        val metaSnap = snapshot.child("meta")
        val meta = SessionMeta(
            viewMode = metaSnap.child("viewMode").getValue(String::class.java)
                ?.let { runCatching { ViewMode.valueOf(it) }.getOrNull() }
                ?: ViewMode.ORBITAL_SCAN,
            hostileContact = metaSnap.child("hostileContact").getValue(Boolean::class.java) ?: false,
            geminiKeyCipher = metaSnap.child("geminiKeyCipher").getValue(String::class.java) ?: "",
            ariaUnlockTier = (metaSnap.child("ariaUnlockTier").getValue(Long::class.java) ?: 1L).toInt(),
            ariaCorrupted = metaSnap.child("ariaCorrupted").getValue(Boolean::class.java) ?: false,
            ariaSleeperTriggered = metaSnap.child("ariaSleeperTriggered").getValue(Boolean::class.java) ?: false
        )

        val shipSnap = snapshot.child("shipState")
        val shipState = ShipState(
            hull = HullState(
                current = shipSnap.child("hull/current").intOr(80),
                max = shipSnap.child("hull/max").intOr(80)
            ),
            power = PowerState(
                available = shipSnap.child("power/available").intOr(12),
                allocated = PowerAllocation(
                    mDrive = shipSnap.child("power/allocated/mDrive").intOr(4),
                    weapons = shipSnap.child("power/allocated/weapons").intOr(4),
                    sensors = shipSnap.child("power/allocated/sensors").intOr(4)
                )
            ),
            thrustPool = ThrustPoolState(
                total = shipSnap.child("thrustPool/total").intOr(4),
                remaining = shipSnap.child("thrustPool/remaining").intOr(4)
            ),
            crits = CritsState(
                mDrive = shipSnap.child("crits/mDrive").intOr(0),
                powerPlant = shipSnap.child("crits/powerPlant").intOr(0),
                sensors = shipSnap.child("crits/sensors").intOr(0),
                weapons = shipSnap.child("crits/weapons").intOr(0),
                computer = shipSnap.child("crits/computer").intOr(0)
            )
        )

        val stationsSnap = snapshot.child("stations")
        val stations = StationsState(
            pilot = PilotStation(
                assignedUid = stationsSnap.child("pilot/assignedUid").getValue(String::class.java),
                evadeActive = stationsSnap.child("pilot/evadeActive").getValue(Boolean::class.java) ?: false,
                incomingPing = stationsSnap.child("pilot/incomingPing").toPingOrNull()
            ),
            command = CommandStation(
                assignedUid = stationsSnap.child("command/assignedUid").getValue(String::class.java),
                boonTarget = stationsSnap.child("command/boonTarget").getValue(String::class.java)
                    ?.let { runCatching { StationRole.valueOf(it) }.getOrNull() },
                incomingPing = stationsSnap.child("command/incomingPing").toPingOrNull()
            ),
            engineer = EngineerStation(
                assignedUid = stationsSnap.child("engineer/assignedUid").getValue(String::class.java),
                overdriveSystem = stationsSnap.child("engineer/overdriveSystem").getValue(String::class.java)
                    ?.let { runCatching { Subsystem.valueOf(it) }.getOrNull() },
                incomingPing = stationsSnap.child("engineer/incomingPing").toPingOrNull()
            ),
            gunner = GunnerStation(
                assignedUid = stationsSnap.child("gunner/assignedUid").getValue(String::class.java),
                lockedTargetId = stationsSnap.child("gunner/lockedTargetId").getValue(String::class.java),
                incomingPing = stationsSnap.child("gunner/incomingPing").toPingOrNull()
            ),
            sensors = SensorsStation(
                assignedUid = stationsSnap.child("sensors/assignedUid").getValue(String::class.java),
                ewJamming = stationsSnap.child("sensors/ewJamming").getValue(Boolean::class.java) ?: false,
                secretIntel = stationsSnap.child("sensors/secretIntel").getValue(String::class.java),
                incomingPing = stationsSnap.child("sensors/incomingPing").toPingOrNull()
            )
        )

        val tacSnap = snapshot.child("tacticalMap")
        val orbitalSnap = tacSnap.child("orbital")
        val anomalies = orbitalSnap.child("anomalies").children.mapNotNull { it.getValue(String::class.java) }
        val orbital = OrbitalScanState(
            systemName = orbitalSnap.child("systemName").getValue(String::class.java) ?: "Vespera-4",
            uwp = orbitalSnap.child("uwp").getValue(String::class.java) ?: "C544632-7",
            contradictionHook = orbitalSnap.child("contradictionHook").getValue(String::class.java)
                ?: "High-output orbital refinery with zero breathable air and rationed water.",
            anomalies = anomalies
        )

        val contacts = tacSnap.child("spaceRadar/contacts").children.mapNotNull { c ->
            val id = c.key ?: return@mapNotNull null
            val band = c.child("rangeBand").getValue(String::class.java)
                ?.let { runCatching { RangeBand.valueOf(it) }.getOrNull() }
                ?: RangeBand.MEDIUM
            id to RadarContact(
                id = id,
                name = c.child("name").getValue(String::class.java) ?: id,
                rangeBand = band,
                bearingDeg = (c.child("bearingDeg").getValue(Double::class.java) ?: 0.0).toFloat(),
                hostile = c.child("hostile").getValue(Boolean::class.java) ?: false,
                transponder = c.child("transponder").getValue(String::class.java) ?: "UNKNOWN"
            )
        }.toMap()

        val nodes = tacSnap.child("groundZones/nodes").children.mapNotNull { n ->
            val id = n.key ?: return@mapNotNull null
            id to GroundNode(
                id = id,
                label = n.child("label").getValue(String::class.java) ?: id,
                xNorm = (n.child("xNorm").getValue(Double::class.java) ?: 0.5).toFloat(),
                yNorm = (n.child("yNorm").getValue(Double::class.java) ?: 0.5).toFloat(),
                connectedTo = n.child("connectedTo").children.mapNotNull { it.getValue(String::class.java) }
            )
        }.toMap()

        val tokens = tacSnap.child("groundZones/tokens").children.mapNotNull { t ->
            val id = t.key ?: return@mapNotNull null
            id to GroundToken(
                id = id,
                label = t.child("label").getValue(String::class.java) ?: id,
                nodeId = t.child("nodeId").getValue(String::class.java) ?: "",
                isHostile = t.child("isHostile").getValue(Boolean::class.java) ?: false
            )
        }.toMap()

        val feedEntries = snapshot.child("feed").children.mapNotNull { f ->
            val id = f.key ?: return@mapNotNull null
            val type = f.child("type").getValue(String::class.java)
                ?.let { runCatching { FeedEntryType.valueOf(it) }.getOrNull() }
                ?: FeedEntryType.SYSTEM
            val diceSnap = f.child("diceRoll")
            val diceRoll = if (diceSnap.exists()) {
                DiceRollDetail(
                    die1 = diceSnap.child("die1").intOr(1),
                    die2 = diceSnap.child("die2").intOr(1),
                    modifier = diceSnap.child("modifier").intOr(0)
                )
            } else {
                null
            }
            val sortTs = f.child("timestampMs").getValue(Long::class.java) ?: 0L
            sortTs to FeedEntry(
                id = id,
                timestampLabel = f.child("timestampLabel").getValue(String::class.java) ?: "--:--:--",
                type = type,
                sender = f.child("sender").getValue(String::class.java) ?: "SYS",
                title = f.child("title").getValue(String::class.java) ?: "",
                body = f.child("body").getValue(String::class.java) ?: "",
                isCorrupted = f.child("isCorrupted").getValue(Boolean::class.java) ?: false,
                isSleeper = f.child("isSleeper").getValue(Boolean::class.java) ?: false,
                diceRoll = diceRoll
            )
        }.sortedByDescending { it.first }.map { it.second }

        return SessionState(
            pin = pin,
            activeRole = role,
            meta = meta,
            shipState = shipState,
            stations = stations,
            tacticalMap = TacticalMapState(
                orbital = orbital,
                spaceRadar = SpaceRadarState(contacts = contacts),
                groundZones = GroundZonesState(nodes = nodes, tokens = tokens)
            ),
            feed = feedEntries
        )
    }

    private fun DataSnapshot.intOr(default: Int): Int =
        (getValue(Long::class.java) ?: default.toLong()).toInt()

    private fun DataSnapshot.toPingOrNull(): StationPing? {
        if (!exists()) return null
        val from = child("from").getValue(String::class.java)
            ?.let { runCatching { StationRole.valueOf(it) }.getOrNull() }
            ?: return null
        return StationPing(
            from = from,
            message = child("message").getValue(String::class.java) ?: "",
            timestampMs = child("timestampMs").getValue(Long::class.java) ?: 0L
        )
    }

    private fun StationRole.stationKey(): String = when (this) {
        StationRole.PILOT -> "pilot"
        StationRole.COMMAND -> "command"
        StationRole.ENGINEER -> "engineer"
        StationRole.GUNNER -> "gunner"
        StationRole.SENSORS -> "sensors"
        StationRole.REFEREE -> "command"
    }
}
