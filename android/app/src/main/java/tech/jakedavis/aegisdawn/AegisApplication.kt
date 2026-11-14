package tech.jakedavis.aegisdawn

import android.app.Application
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.FirebaseDatabase
import tech.jakedavis.aegisdawn.data.MockSessionRepository
import tech.jakedavis.aegisdawn.data.SessionPreferences
import tech.jakedavis.aegisdawn.data.SessionRepository
import tech.jakedavis.aegisdawn.data.ShipCombatRepository

class AegisApplication : Application() {

    lateinit var sessionPreferences: SessionPreferences
        private set

    lateinit var sessionRepository: SessionRepository
        private set

    override fun onCreate() {
        super.onCreate()
        sessionPreferences = SessionPreferences(this)

        val firebaseApps = runCatching { FirebaseApp.getApps(this) }.getOrDefault(emptyList())
        sessionRepository = if (firebaseApps.isNotEmpty()) {
            val db = FirebaseDatabase.getInstance().apply {
                runCatching { setPersistenceEnabled(true) }
            }
            ShipCombatRepository(
                auth = FirebaseAuth.getInstance(),
                database = db,
                prefs = sessionPreferences
            )
        } else {
            MockSessionRepository()
        }
    }
}
