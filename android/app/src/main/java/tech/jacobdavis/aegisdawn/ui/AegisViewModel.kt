package tech.jacobdavis.aegisdawn.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import kotlinx.coroutines.flow.StateFlow
import tech.jacobdavis.aegisdawn.data.MockSessionRepository
import tech.jacobdavis.aegisdawn.data.SessionRepository
import tech.jacobdavis.aegisdawn.model.GroundZonePreset
import tech.jacobdavis.aegisdawn.model.RangeBand
import tech.jacobdavis.aegisdawn.model.SessionState
import tech.jacobdavis.aegisdawn.model.StationRole
import tech.jacobdavis.aegisdawn.model.Subsystem
import tech.jacobdavis.aegisdawn.model.ViewMode

class AegisViewModel(
    private val repository: SessionRepository = MockSessionRepository()
) : ViewModel() {

    class Factory(private val repository: SessionRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            AegisViewModel(repository) as T
    }

    val sessionState: StateFlow<SessionState?> = repository.sessionState

    fun connect(pin: String, role: StationRole) = repository.connect(pin, role)
    fun disconnect() = repository.disconnect()

    fun adjustHull(delta: Int) = repository.adjustHull(delta)
    fun adjustThrust(delta: Int) = repository.adjustThrust(delta)
    fun adjustPowerAvailable(delta: Int) = repository.adjustPowerAvailable(delta)
    fun allocatePower(system: Subsystem, delta: Int) = repository.allocatePower(system, delta)
    fun adjustCrit(system: Subsystem, delta: Int) = repository.adjustCrit(system, delta)

    fun toggleEvade() = repository.toggleEvade()
    fun setCommandBoon(target: StationRole?) = repository.setCommandBoon(target)
    fun setEngineerOverdrive(system: Subsystem?) = repository.setEngineerOverdrive(system)
    fun setGunnerTarget(contactId: String?) = repository.setGunnerTarget(contactId)
    fun toggleEwJamming() = repository.toggleEwJamming()
    fun broadcastSecretIntel() = repository.broadcastSecretIntel()
    fun pushSecretIntel(intel: String) = repository.pushSecretIntel(intel)

    fun sendPing(from: StationRole, to: StationRole, message: String) =
        repository.sendPing(from, to, message)

    fun acknowledgePing(station: StationRole) = repository.acknowledgePing(station)

    fun roll2d6(sender: String, label: String, modifier: Int = 0) =
        repository.roll2d6(sender, label, modifier)

    fun setViewMode(mode: ViewMode) = repository.setViewMode(mode)
    fun toggleHostileContact() = repository.toggleHostileContact()
    fun setAriaTier(tier: Int) = repository.setAriaTier(tier)
    fun toggleAriaCorrupted() = repository.toggleAriaCorrupted()
    fun toggleAriaSleeper() = repository.toggleAriaSleeper()
    fun triggerAriaScan() = repository.triggerAriaScan()
    fun quickInjectSystem(keyword: String) = repository.quickInjectSystem(keyword)
    fun seedGeminiKey(apiKey: String) = repository.seedGeminiKey(apiKey)
    fun pushQuickRuleCard(query: String) = repository.pushQuickRuleCard(query)
    fun moveGroundToken(tokenId: String, targetNodeId: String) =
        repository.moveGroundToken(tokenId, targetNodeId)

    fun addRadarContact(
        name: String,
        rangeBand: RangeBand,
        hostile: Boolean,
        transponder: String = "UNKNOWN"
    ) = repository.addRadarContact(name, rangeBand, hostile, transponder)

    fun updateContactRange(contactId: String, rangeBand: RangeBand) =
        repository.updateContactRange(contactId, rangeBand)

    fun removeRadarContact(contactId: String) = repository.removeRadarContact(contactId)

    fun loadGroundZonePreset(preset: GroundZonePreset) = repository.loadGroundZonePreset(preset)

    fun addGroundToken(label: String, isHostile: Boolean) = repository.addGroundToken(label, isHostile)

    fun removeGroundToken(tokenId: String) = repository.removeGroundToken(tokenId)
}
