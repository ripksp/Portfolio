package tech.jacobdavis.aegisdawn

import android.app.Application
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.FirebaseDatabase
import tech.jacobdavis.aegisdawn.data.MockSessionRepository
import tech.jacobdavis.aegisdawn.data.SessionPreferences
import tech.jacobdavis.aegisdawn.data.SessionRepository
import tech.jacobdavis.aegisdawn.data.ShipCombatRepository

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
            val app = firebaseApps.first()
            val dbUrl = app.options.databaseUrl
            val db = if (dbUrl.isNullOrBlank()) {
                FirebaseDatabase.getInstance("https://traveller-5a0bc-default-rtdb.firebaseio.com")
            } else {
                FirebaseDatabase.getInstance()
            }.apply {
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
