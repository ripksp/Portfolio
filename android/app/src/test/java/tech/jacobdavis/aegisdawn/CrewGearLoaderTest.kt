package tech.jacobdavis.aegisdawn

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import tech.jacobdavis.aegisdawn.data.CrewGearLoader
import java.io.File

class CrewGearLoaderTest {

    @Test
    fun `crew_gear json asset parses armor and 5 tappable items`() {
        val assetFile = File("src/main/assets/crew_gear.json")
        assertTrue("crew_gear.json should exist", assetFile.exists())
        val data = CrewGearLoader.parseJson(assetFile.readText())
        assertEquals("Salvaged Vacc Suit", data.armor.name)
        assertEquals(4, data.armor.rating)
        assertEquals(5, data.items.size)
    }
}
