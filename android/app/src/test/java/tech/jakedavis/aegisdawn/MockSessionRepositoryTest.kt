package tech.jakedavis.aegisdawn

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import tech.jakedavis.aegisdawn.data.MockSessionRepository
import tech.jakedavis.aegisdawn.model.FeedEntryType
import tech.jakedavis.aegisdawn.model.GroundZonePreset
import tech.jakedavis.aegisdawn.model.RangeBand
import tech.jakedavis.aegisdawn.model.StationRole
import tech.jakedavis.aegisdawn.model.Subsystem
import tech.jakedavis.aegisdawn.model.ViewMode
import kotlin.random.Random

class MockSessionRepositoryTest {

    @Test
    fun `connect initializes session with normalized 4-char pin and role`() {
        val repo = MockSessionRepository()
        repo.connect("aegs12", StationRole.ENGINEER)

        val state = repo.sessionState.value
        assertNotNull(state)
        assertEquals("AEGS", state!!.pin)
        assertEquals(StationRole.ENGINEER, state.activeRole)
        assertEquals(80, state.shipState.hull.current)
    }

    @Test
    fun `computer crit automatically sets ariaCorrupted true`() {
        val repo = MockSessionRepository()
        repo.connect("AEGS", StationRole.REFEREE)
        assertFalse(repo.sessionState.value!!.meta.ariaCorrupted)

        repo.adjustCrit(Subsystem.COMPUTER, 1)

        val state = repo.sessionState.value!!
        assertEquals(1, state.shipState.crits.computer)
        assertTrue(state.meta.ariaCorrupted)
    }

    @Test
    fun `cross station ping sets incomingPing and acknowledge clears it`() {
        val repo = MockSessionRepository()
        repo.connect("AEGS", StationRole.PILOT)

        repo.sendPing(StationRole.PILOT, StationRole.ENGINEER, "Need evasive power!")
        val afterPing = repo.sessionState.value!!
        assertNotNull(afterPing.stations.engineer.incomingPing)
        assertEquals(StationRole.PILOT, afterPing.stations.engineer.incomingPing!!.from)

        repo.acknowledgePing(StationRole.ENGINEER)
        assertNull(repo.sessionState.value!!.stations.engineer.incomingPing)
    }

    @Test
    fun `sensors secret intel broadcasts to feed and clears private slot`() {
        val repo = MockSessionRepository()
        repo.connect("AEGS", StationRole.SENSORS)

        repo.pushSecretIntel("Bio-lab signature on deck 3")
        assertEquals("Bio-lab signature on deck 3", repo.sessionState.value!!.stations.sensors.secretIntel)

        repo.broadcastSecretIntel()
        val state = repo.sessionState.value!!
        assertNull(state.stations.sensors.secretIntel)
        assertTrue(state.feed.any { it.type == FeedEntryType.INTEL && it.body.contains("Bio-lab signature") })
    }

    @Test
    fun `roll2d6 appends roll entry to feed`() {
        val repo = MockSessionRepository(Random(42))
        repo.connect("AEGS", StationRole.GUNNER)
        val initialSize = repo.sessionState.value!!.feed.size

        repo.roll2d6("GUN", "TURRET SHOT", modifier = 2)

        val state = repo.sessionState.value!!
        assertEquals(initialSize + 1, state.feed.size)
        val top = state.feed.first()
        assertEquals(FeedEntryType.ROLL, top.type)
        assertNotNull(top.diceRoll)
        assertEquals(2, top.diceRoll!!.modifier)
    }

    @Test
    fun `quickInjectSystem updates orbital map and sets orbital view mode`() {
        val repo = MockSessionRepository()
        repo.connect("AEGS", StationRole.REFEREE)
        repo.setViewMode(ViewMode.SPACE_COMBAT)

        repo.quickInjectSystem("Derelict")

        val state = repo.sessionState.value!!
        assertEquals(ViewMode.ORBITAL_SCAN, state.meta.viewMode)
        assertEquals("Kestrel Drift", state.tacticalMap.orbital.systemName)
    }

    @Test
    fun `moveGroundToken updates token node`() {
        val repo = MockSessionRepository()
        repo.connect("AEGS", StationRole.REFEREE)

        repo.moveGroundToken("declan", "bridge")

        val declan = repo.sessionState.value!!.tacticalMap.groundZones.tokens["declan"]
        assertNotNull(declan)
        assertEquals("bridge", declan!!.nodeId)
    }

    @Test
    fun `radar contact spawner adds updates range and removes contact`() {
        val repo = MockSessionRepository()
        repo.connect("AEGS", StationRole.REFEREE)

        repo.addRadarContact("Voidbreaker Corsair", RangeBand.LONG, hostile = true)
        val afterAdd = repo.sessionState.value!!
        assertEquals(ViewMode.SPACE_COMBAT, afterAdd.meta.viewMode)
        assertTrue(afterAdd.meta.hostileContact)
        val spawned = afterAdd.tacticalMap.spaceRadar.contacts.values.first { it.name == "VOIDBREAKER CORSAIR" }
        assertEquals(RangeBand.LONG, spawned.rangeBand)

        repo.updateContactRange(spawned.id, RangeBand.SHORT)
        assertEquals(
            RangeBand.SHORT,
            repo.sessionState.value!!.tacticalMap.spaceRadar.contacts[spawned.id]!!.rangeBand
        )

        repo.removeRadarContact(spawned.id)
        assertNull(repo.sessionState.value!!.tacticalMap.spaceRadar.contacts[spawned.id])
    }

    @Test
    fun `ground zone preset and token spawner work cleanly`() {
        val repo = MockSessionRepository()
        repo.connect("AEGS", StationRole.REFEREE)

        repo.loadGroundZonePreset(GroundZonePreset.BIO_LAB_VAULT)
        val afterPreset = repo.sessionState.value!!
        assertEquals(ViewMode.GROUND_ZONES, afterPreset.meta.viewMode)
        assertTrue(afterPreset.tacticalMap.groundZones.nodes.containsKey("vault"))

        repo.addGroundToken("CHIMERA-2", isHostile = true)
        val added = repo.sessionState.value!!.tacticalMap.groundZones.tokens.values.first { it.label == "CHIMERA-2" }
        repo.removeGroundToken(added.id)
        assertNull(repo.sessionState.value!!.tacticalMap.groundZones.tokens[added.id])
    }
}
