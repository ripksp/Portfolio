package tech.jacobdavis.aegisdawn.model

enum class StationRole(val code: String, val displayName: String) {
    PILOT("PIL", "Pilot"),
    COMMAND("CMD", "Command"),
    ENGINEER("ENG", "Engineer"),
    GUNNER("GUN", "Gunner"),
    SENSORS("SEN", "Sensors"),
    REFEREE("REF", "Referee")
}

enum class CommlinkTab(val label: String) {
    BRIDGE("BRIDGE"),
    LOADOUT("LOADOUT"),
    FEED("FEED")
}

enum class ViewMode(val label: String) {
    ORBITAL_SCAN("ORBITAL SCAN"),
    SPACE_COMBAT("SPACE RADAR"),
    GROUND_ZONES("GROUND ZONES")
}

enum class Subsystem(val label: String) {
    M_DRIVE("M-DRIVE"),
    POWER_PLANT("PWR PLANT"),
    SENSORS("SENSORS"),
    WEAPONS("WEAPONS"),
    COMPUTER("COMPUTER")
}

enum class RangeBand(val ringIndex: Int, val label: String) {
    ADJACENT(1, "ADJ"),
    CLOSE(2, "CLS"),
    SHORT(3, "SHT"),
    MEDIUM(4, "MED"),
    LONG(5, "LNG"),
    DISTANT(6, "DST")
}

enum class GroundZonePreset(val label: String) {
    SHIP_BOARDING("BOARDING"),
    ORBITAL_REFINERY("REFINERY"),
    BIO_LAB_VAULT("BIO-LAB")
}

data class SessionMeta(
    val viewMode: ViewMode = ViewMode.ORBITAL_SCAN,
    val hostileContact: Boolean = false,
    val geminiKeyCipher: String = "",
    val ariaUnlockTier: Int = 1,
    val ariaCorrupted: Boolean = false,
    val ariaSleeperTriggered: Boolean = false
)

data class HullState(
    val current: Int = 80,
    val max: Int = 80
)

data class PowerAllocation(
    val mDrive: Int = 4,
    val weapons: Int = 4,
    val sensors: Int = 4
) {
    val totalAllocated: Int get() = mDrive + weapons + sensors
}

data class PowerState(
    val available: Int = 12,
    val allocated: PowerAllocation = PowerAllocation()
)

data class ThrustPoolState(
    val total: Int = 4,
    val remaining: Int = 4
)

data class CritsState(
    val mDrive: Int = 0,
    val powerPlant: Int = 0,
    val sensors: Int = 0,
    val weapons: Int = 0,
    val computer: Int = 0
) {
    val hasAnyCrit: Boolean
        get() = mDrive > 0 || powerPlant > 0 || sensors > 0 || weapons > 0 || computer > 0
}

data class ShipState(
    val hull: HullState = HullState(),
    val power: PowerState = PowerState(),
    val thrustPool: ThrustPoolState = ThrustPoolState(),
    val crits: CritsState = CritsState()
)

data class StationPing(
    val from: StationRole,
    val message: String,
    val timestampMs: Long
)

data class PilotStation(
    val assignedUid: String? = null,
    val evadeActive: Boolean = false,
    val incomingPing: StationPing? = null
)

data class CommandStation(
    val assignedUid: String? = null,
    val boonTarget: StationRole? = null,
    val incomingPing: StationPing? = null
)

data class EngineerStation(
    val assignedUid: String? = null,
    val overdriveSystem: Subsystem? = null,
    val incomingPing: StationPing? = null
)

data class GunnerStation(
    val assignedUid: String? = null,
    val lockedTargetId: String? = null,
    val incomingPing: StationPing? = null
)

data class SensorsStation(
    val assignedUid: String? = null,
    val ewJamming: Boolean = false,
    val secretIntel: String? = null,
    val incomingPing: StationPing? = null
)

data class StationsState(
    val pilot: PilotStation = PilotStation(),
    val command: CommandStation = CommandStation(),
    val engineer: EngineerStation = EngineerStation(),
    val gunner: GunnerStation = GunnerStation(),
    val sensors: SensorsStation = SensorsStation()
)

data class OrbitalScanState(
    val systemName: String = "Vespera-4",
    val uwp: String = "C544632-7",
    val contradictionHook: String = "High-output orbital refinery with zero breathable air and rationed water.",
    val anomalies: List<String> = listOf(
        "Unregistered beacon pulsing on 142.8 MHz",
        "Refinery flare signature exceeds listed TL-7 output"
    )
)

data class RadarContact(
    val id: String,
    val name: String,
    val rangeBand: RangeBand,
    val bearingDeg: Float,
    val hostile: Boolean = false,
    val transponder: String = "UNKNOWN"
)

data class SpaceRadarState(
    val contacts: Map<String, RadarContact> = emptyMap()
)

data class GroundNode(
    val id: String,
    val label: String,
    val xNorm: Float,
    val yNorm: Float,
    val connectedTo: List<String>
)

data class GroundToken(
    val id: String,
    val label: String,
    val nodeId: String,
    val isHostile: Boolean = false
)

data class GroundZonesState(
    val nodes: Map<String, GroundNode> = emptyMap(),
    val tokens: Map<String, GroundToken> = emptyMap()
)

data class TacticalMapState(
    val orbital: OrbitalScanState = OrbitalScanState(),
    val spaceRadar: SpaceRadarState = SpaceRadarState(),
    val groundZones: GroundZonesState = GroundZonesState()
)

enum class FeedEntryType {
    ARIA,
    ROLL,
    SYSTEM,
    INTEL,
    PING
}

data class DiceRollDetail(
    val die1: Int,
    val die2: Int,
    val modifier: Int
) {
    val total: Int get() = die1 + die2 + modifier
}

data class FeedEntry(
    val id: String,
    val timestampLabel: String,
    val type: FeedEntryType,
    val sender: String,
    val title: String,
    val body: String,
    val isCorrupted: Boolean = false,
    val isSleeper: Boolean = false,
    val diceRoll: DiceRollDetail? = null
)

data class SessionState(
    val pin: String = "AEGS",
    val activeRole: StationRole = StationRole.PILOT,
    val meta: SessionMeta = SessionMeta(),
    val shipState: ShipState = ShipState(),
    val stations: StationsState = StationsState(),
    val tacticalMap: TacticalMapState = TacticalMapState(),
    val feed: List<FeedEntry> = emptyList()
)
