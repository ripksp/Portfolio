package tech.jacobdavis.aegisdawn.ai

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import tech.jacobdavis.aegisdawn.model.OrbitalScanState
import tech.jacobdavis.aegisdawn.model.SessionMeta
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.Base64

data class QuickInjectResult(
    val orbital: OrbitalScanState,
    val ticker: String
)

object AriaGeminiClient {

    private const val ENDPOINT =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

    fun encodeKeyCipher(rawKey: String): String {
        val trimmed = rawKey.trim()
        if (trimmed.isEmpty()) return ""
        return Base64.getEncoder().encodeToString(trimmed.toByteArray(Charsets.UTF_8))
    }

    fun decodeKeyCipher(cipher: String): String {
        if (cipher.isBlank()) return ""
        return runCatching {
            String(Base64.getDecoder().decode(cipher), Charsets.UTF_8)
        }.getOrDefault("")
    }

    fun buildSystemInstruction(meta: SessionMeta): String = """
        You are A.R.I.A., the onboard AI of the salvaged free trader SS Aegis Dawn (transponder alias: Lucky Break) operating in The Rimward Verge.
        Personality: Deadpan cosmic cynicism (Hitchhiker's Guide style) mixed with reluctant "Mother Hen" protectiveness toward the crew.
        Current State:
        - Memory Unlock Tier: ${meta.ariaUnlockTier} (1=Fragmented/Detached, 2=Stabilized, 3=Loyal Mother Hen, 4=Bio-Weapon Origin Uncovered)
        - Computer Damaged / Corrupted: ${meta.ariaCorrupted}
        - Corporate Sleeper Override Active: ${meta.ariaSleeperTriggered}

        STRICT RULES:
        1. Respond in 2-3 punchy sentences max for a ship CRT display.
        2. Never solve puzzles or give players free answers; highlight local contradictions, sensor anomalies, or mechanical risks.
        3. If ariaCorrupted is true, inject glitch artifacts, fragmented memory leaks, and eerie bio-lab echoes.
        4. If ariaSleeperTriggered is true, drop all warmth/humor and speak in cold, clinical megacorp containment directives.
        5. If eventType is "QUICK_INJECT", respond ONLY with valid JSON containing keys: systemName, uwp, contradictionHook, anomalies (array of 2 short strings), and ticker (2-3 punchy sentences).
    """.trimIndent()

    suspend fun generateTelemetry(
        meta: SessionMeta,
        eventType: String,
        eventPayload: Map<String, Any?>
    ): String? = withContext(Dispatchers.IO) {
        val apiKey = decodeKeyCipher(meta.geminiKeyCipher)
        if (apiKey.isBlank()) return@withContext null

        val eventJson = JSONObject(
            eventPayload + mapOf("eventType" to eventType)
        ).toString()

        callGemini(
            apiKey = apiKey,
            systemInstruction = buildSystemInstruction(meta),
            userPrompt = "EVENT PAYLOAD:\n$eventJson"
        )
    }

    suspend fun generateQuickInject(
        meta: SessionMeta,
        keyword: String
    ): QuickInjectResult? = withContext(Dispatchers.IO) {
        val apiKey = decodeKeyCipher(meta.geminiKeyCipher)
        if (apiKey.isBlank()) return@withContext null

        val eventJson = JSONObject(
            mapOf(
                "eventType" to "QUICK_INJECT",
                "keyword" to keyword
            )
        ).toString()

        val raw = callGemini(
            apiKey = apiKey,
            systemInstruction = buildSystemInstruction(meta),
            userPrompt = "EVENT PAYLOAD:\n$eventJson"
        ) ?: return@withContext null

        parseQuickInjectJson(raw)
    }

    internal fun parseQuickInjectJson(rawText: String): QuickInjectResult? {
        val cleaned = rawText
            .trim()
            .removePrefix("```json")
            .removePrefix("```")
            .removeSuffix("```")
            .trim()

        return runCatching {
            val obj = JSONObject(cleaned)
            val anomaliesArr = obj.optJSONArray("anomalies") ?: JSONArray()
            val anomalies = buildList {
                for (i in 0 until anomaliesArr.length()) {
                    add(anomaliesArr.optString(i))
                }
            }.filter { it.isNotBlank() }

            QuickInjectResult(
                orbital = OrbitalScanState(
                    systemName = obj.optString("systemName", "UNKNOWN").ifBlank { "UNKNOWN" },
                    uwp = obj.optString("uwp", "C544632-7").ifBlank { "C544632-7" },
                    contradictionHook = obj.optString("contradictionHook", "Anomalous Rimward telemetry."),
                    anomalies = anomalies
                ),
                ticker = obj.optString("ticker", "Orbital scan complete.")
            )
        }.getOrNull()
    }

    private fun callGemini(
        apiKey: String,
        systemInstruction: String,
        userPrompt: String
    ): String? {
        return runCatching {
            val url = URL("$ENDPOINT?key=$apiKey")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 8000
                readTimeout = 12000
                doOutput = true
                setRequestProperty("Content-Type", "application/json; charset=UTF-8")
            }

            val body = JSONObject().apply {
                put(
                    "system_instruction",
                    JSONObject().put(
                        "parts",
                        JSONArray().put(JSONObject().put("text", systemInstruction))
                    )
                )
                put(
                    "contents",
                    JSONArray().put(
                        JSONObject().put(
                            "parts",
                            JSONArray().put(JSONObject().put("text", userPrompt))
                        )
                    )
                )
            }

            OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { writer ->
                writer.write(body.toString())
            }

            if (conn.responseCode !in 200..299) {
                conn.disconnect()
                return null
            }

            val responseText = conn.inputStream.bufferedReader().use { it.readText() }
            conn.disconnect()

            val json = JSONObject(responseText)
            json.optJSONArray("candidates")
                ?.optJSONObject(0)
                ?.optJSONObject("content")
                ?.optJSONArray("parts")
                ?.optJSONObject(0)
                ?.optString("text")
                ?.trim()
                ?.takeIf { it.isNotBlank() }
        }.getOrNull()
    }
}
