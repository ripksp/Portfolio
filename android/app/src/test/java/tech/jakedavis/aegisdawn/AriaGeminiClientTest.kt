package tech.jakedavis.aegisdawn

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import tech.jakedavis.aegisdawn.ai.AriaGeminiClient
import tech.jakedavis.aegisdawn.model.SessionMeta

class AriaGeminiClientTest {

    @Test
    fun `encode and decode key cipher round trips cleanly`() {
        val cipher = AriaGeminiClient.encodeKeyCipher("AIzaTestKey123")
        assertEquals("AIzaTestKey123", AriaGeminiClient.decodeKeyCipher(cipher))
    }

    @Test
    fun `buildSystemInstruction includes tier, corruption, and sleeper flags`() {
        val meta = SessionMeta(
            ariaUnlockTier = 3,
            ariaCorrupted = true,
            ariaSleeperTriggered = false
        )
        val prompt = AriaGeminiClient.buildSystemInstruction(meta)
        assertTrue(prompt.contains("Memory Unlock Tier: 3"))
        assertTrue(prompt.contains("Computer Damaged / Corrupted: true"))
        assertTrue(prompt.contains("Corporate Sleeper Override Active: false"))
    }
}
