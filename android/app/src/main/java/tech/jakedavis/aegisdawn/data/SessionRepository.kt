package tech.jakedavis.aegisdawn.data

import kotlinx.coroutines.flow.StateFlow
import tech.jakedavis.aegisdawn.model.GroundZonePreset
import tech.jakedavis.aegisdawn.model.RangeBand
import tech.jakedavis.aegisdawn.model.SessionState
import tech.jakedavis.aegisdawn.model.StationRole
import tech.jakedavis.aegisdawn.model.Subsystem
import tech.jakedavis.aegisdawn.model.ViewMode

interface SessionRepository {
    val sessionState: StateFlow<SessionState?>

    fun connect(pin: String, role: StationRole)
    fun disconnect()

    fun adjustHull(delta: Int)
    fun adjustThrust(delta: Int)
    fun adjustPowerAvailable(delta: Int)
    fun allocatePower(system: Subsystem, delta: Int)
    fun adjustCrit(system: Subsystem, delta: Int)

    fun toggleEvade()
    fun setCommandBoon(target: StationRole?)
    fun setEngineerOverdrive(system: Subsystem?)
    fun setGunnerTarget(contactId: String?)
    fun toggleEwJamming()
    fun broadcastSecretIntel()
    fun pushSecretIntel(intel: String)

    fun sendPing(from: StationRole, to: StationRole, message: String)
    fun acknowledgePing(station: StationRole)

    fun roll2d6(sender: String, label: String, modifier: Int = 0)

    fun setViewMode(mode: ViewMode)
    fun toggleHostileContact()
    fun setAriaTier(tier: Int)
    fun toggleAriaCorrupted()
    fun toggleAriaSleeper()
    fun triggerAriaScan()
    fun quickInjectSystem(keyword: String)
    fun seedGeminiKey(apiKey: String)
    fun pushQuickRuleCard(query: String)
    fun moveGroundToken(tokenId: String, targetNodeId: String)

    fun addRadarContact(name: String, rangeBand: RangeBand, hostile: Boolean, transponder: String = "UNKNOWN")
    fun updateContactRange(contactId: String, rangeBand: RangeBand)
    fun removeRadarContact(contactId: String)
    fun loadGroundZonePreset(preset: GroundZonePreset)
    fun addGroundToken(label: String, isHostile: Boolean)
    fun removeGroundToken(tokenId: String)
}
