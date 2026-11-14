package tech.jakedavis.aegisdawn

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material3.windowsizeclass.ExperimentalMaterial3WindowSizeClassApi
import androidx.compose.material3.windowsizeclass.WindowWidthSizeClass
import androidx.compose.material3.windowsizeclass.calculateWindowSizeClass
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import tech.jakedavis.aegisdawn.ui.AegisViewModel
import tech.jakedavis.aegisdawn.ui.components.CrtScanlineOverlay
import tech.jakedavis.aegisdawn.ui.screens.PlayerCommlinkScreen
import tech.jakedavis.aegisdawn.ui.screens.RefereeDeckScreen
import tech.jakedavis.aegisdawn.ui.screens.SessionJoinScreen
import tech.jakedavis.aegisdawn.ui.theme.AegisCrtTheme

class MainActivity : ComponentActivity() {
    @OptIn(ExperimentalMaterial3WindowSizeClassApi::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val app = application as AegisApplication
        setContent {
            val windowSizeClass = calculateWindowSizeClass(this)
            val isExpandedDeck = windowSizeClass.widthSizeClass != WindowWidthSizeClass.Compact
            val vm: AegisViewModel = viewModel(
                factory = AegisViewModel.Factory(app.sessionRepository)
            )
            val session by vm.sessionState.collectAsState()

            LaunchedEffect(Unit) {
                if (session == null) {
                    app.sessionPreferences.load()?.let { saved ->
                        vm.connect(saved.pin, saved.role)
                    }
                }
            }

            AegisCrtTheme {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .safeDrawingPadding()
                ) {
                    val activeSession = session
                    if (activeSession == null) {
                        SessionJoinScreen(
                            onConnect = { pin, role -> vm.connect(pin, role) }
                        )
                    } else if (isExpandedDeck) {
                        RefereeDeckScreen(
                            session = activeSession,
                            viewModel = vm,
                            onDisconnect = vm::disconnect
                        )
                    } else {
                        PlayerCommlinkScreen(
                            session = activeSession,
                            viewModel = vm,
                            onDisconnect = vm::disconnect
                        )
                    }

                    // Subtle non-interactive retro CRT scanline overlay
                    CrtScanlineOverlay()
                }
            }
        }
    }
}
