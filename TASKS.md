# TASKS.md — Phased Vertical Build Plan for Antigravity

Execute these slices in strict sequential order. Do not advance to the next slice until the current slice compiles, runs cleanly, and passes verification.

## Slice 1: Retro-CRT Theme, Navigation & Local Mock Consoles
- [x] **1.1 Theme & Typography:** Configure Jetpack Compose Material 3 dark theme locked to phosphor-green CRT palette (`#0A0F0A` background, `#33FF66` primary, `#FFB000` amber, `#FF3B30` alert) with monospace typography and subtle terminal borders.
- [x] **1.2 Entry & Session Flow:** Build the Session Join screen (4-character PIN input + Role/Station picker: `Pilot`, `Command`, `Engineer`, `Gunner`, `Sensors`, `Referee`) backed by an in-memory mock repository.
- [x] **1.3 Player 3-Tab Commlink (`< 600dp`):**
  - Build `[ BRIDGE ]` tab with shared Hull/Power/Thrust top bar and role-specific interactive controls + cross-station "Ping/Nudge" buttons.
  - Build `[ FEED ]` tab displaying scrolling terminal telemetry, 2D6 roll results, and A.R.I.A. alert cards.
- [x] **1.4 Z Fold 8 Ultra Dual-Pane Referee Deck (`>= 600dp`):**
  - Left Pane: Live tactical viewport (`Orbital Scan`, `Space Combat Radar`, `Ground Zone Map` switcher + *Aegis Dawn* wireframe).
  - Right Pane: Referee override controls (Hull/Power/Crit steppers, Hostile Contact toggle, view mode switcher, Quick-Inject keyword bar, and manual A.R.I.A. state toggles for `Corrupted` and `Sleeper Override`).

## Slice 2: Conflict-Free Firebase RTDB Sync & Presence
- [x] **2.1 Auth & Persistence:** Wire Firebase Anonymous Auth and enable RTDB offline persistence (`setPersistenceEnabled(true)`). Auto-restore station assignment on app restart using cached Session PIN + UID.
- [x] **2.2 Atomic Transactions:** Implement `ShipCombatRepository` using `callbackFlow` listeners and `runTransaction()` for shared `hull`, `power`, and `thrustPool` mutations.
- [x] **2.3 Cross-Station Pings & Secret Intel:**
  - Wire station-to-station Pings (e.g., Pilot requesting Evasive Power pulses Engineer's UI amber).
  - Implement `stations/sensors/secretIntel` so Referee-pushed scan results appear privately on the Sensors commlink first, with a single `[ BROADCAST TO BRIDGE ]` button to push to the public feed.
- [x] **2.4 RTDB Security Rules:** Write `database.rules.json` enforcing station seat ownership while granting full read/write overrides to the session Referee UID.

## Slice 3: Browser-Based Xbox Bridge Viewscreen (`bridge-viewscreen.html`)
- [x] **3.1 Standalone Web Client:** Create a self-contained `bridge-viewscreen.html` (inline CSS/JS, Firebase JS SDK) matching the exact retro-green CRT aesthetic for Xbox Microsoft Edge full-screen display.
- [x] **3.2 Three View Modes:**
  - `ORBITAL_SCAN`: Renders current system UWP telemetry, planetary wireframe, contradiction hook, and active anomalies.
  - `SPACE_COMBAT`: Renders concentric *Traveller* Range Band rings (`Adjacent` to `Distant`), *SS Aegis Dawn* center icon, enemy blips, and hull critical indicators.
  - `GROUND_ZONES`: Renders 3–5 connected tactical zone nodes with live-animating crew and enemy tokens synced from the Referee's Z Fold 8 drag/tap controls.
- [x] **3.3 Live Ticker & Optional Web Audio:** Render incoming A.R.I.A. alerts at the bottom of the screen and add a toggleable Web Audio API synthesizer for subtle CRT chimes, radar pings, and red-alert klaxons (muted until user clicks/taps screen once).

## Slice 4: Event-Driven A.R.I.A. & Referee Quick-Inject
- [x] **4.1 Referee Gemini Key Seeding:** Add secure input on the Referee Deck to store the Gemini API key in `sessions/{pin}/meta/geminiKeyCipher`.
- [x] **4.2 Event Triggers:** Automatically invoke Gemini (`gemini-2.5-flash`) using `ARIA_PERSONA.md` instructions when:
  - Referee jumps to a new system or enters a keyword/UWP in the **Quick-Inject Parser** (populates `tacticalMap` + generates A.R.I.A.'s orbital scan).
  - Critical hits occur (`crits.computer > 0` flips `ariaCorrupted = true`), Hull drops below 50%/0%, or Referee triggers `ariaSleeperTriggered`.
  - Referee triggers a quick rule/gear lookup card pushed to `[ FEED ]`.

## Slice 5: Pip-Boy `[ LOADOUT ]` Tab & Crew Gear
- [x] **5.1 Gear Schema:** Create a starter `crew_gear.json` defining equipped weapons, armor, and field gear (Name, Damage/Effect, Range, 1-line Trait note).
- [x] **5.2 Loadout UI & Stabilization State:** Build the `[ LOADOUT ]` tab with personal Endurance/HP steppers, equipped Armor badge, and tappable weapon/gear cards that roll `2D6 + Mod` directly into `/feed`. Automatically switch the tab to an emergency **Stabilization / Medic Tracker** when Endurance reaches 0.
