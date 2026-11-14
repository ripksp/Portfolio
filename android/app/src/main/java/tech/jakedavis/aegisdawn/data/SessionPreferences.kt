package tech.jakedavis.aegisdawn.data

import android.content.Context
import tech.jakedavis.aegisdawn.model.StationRole

data class SavedSession(
    val pin: String,
    val role: StationRole
)

class SessionPreferences(context: Context) {
    private val prefs = context.getSharedPreferences("aegis_commlink_prefs", Context.MODE_PRIVATE)

    fun save(pin: String, role: StationRole) {
        prefs.edit()
            .putString(KEY_PIN, pin)
            .putString(KEY_ROLE, role.name)
            .apply()
    }

    fun load(): SavedSession? {
        val pin = prefs.getString(KEY_PIN, null) ?: return null
        val roleName = prefs.getString(KEY_ROLE, null) ?: return null
        val role = runCatching { StationRole.valueOf(roleName) }.getOrNull() ?: return null
        return SavedSession(pin = pin, role = role)
    }

    fun clear() {
        prefs.edit().remove(KEY_PIN).remove(KEY_ROLE).apply()
    }

    private companion object {
        const val KEY_PIN = "session_pin"
        const val KEY_ROLE = "session_role"
    }
}
