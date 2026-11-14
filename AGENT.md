# AGENT.md — SS Aegis Dawn / Lucky Break Tactical Commlink & Bridge Viewscreen

## 1. Project Identity & Core Philosophy
- **Campaign:** *The Rimward Verge* (*Mongoose Traveller 2e*)
- **Vessel:** *SS Aegis Dawn* (salvaged registry / transponder alias: *Lucky Break*)
- **Core Philosophy:** **Permissive, Story-First Exploration.** This system accelerates tabletop play; it is NOT a rules-enforcement engine. Never lock UI controls behind combat phases, turn timers, or automated modifier math. Players and the Referee can trigger actions, adjust pools, and roll checks freely at any time.

## 2. Target Platforms & Tech Stack
1. **Android Commlink App (Player & Referee Console):**
   - **Language / UI:** Kotlin, Jetpack Compose, Material 3, adaptive layouts via `WindowSizeClass`.
   - **Primary Hardware Target:** Single-handed Phone / Folded Cover Screen (Player Mode) + Unfolded Samsung Galaxy Z Fold 8 Ultra (Dual-Pane Referee Command Deck).
2. **Browser Bridge Viewscreen (Public TV Display):**
   - **Tech:** Single-file static HTML/CSS/Vanilla JS (`bridge-viewscreen.html`) using the Firebase JS Modular SDK (v10+).
   - **Primary Hardware Target:** Microsoft Edge on Xbox console (read-only live monitor hosted on `jakedavis.tech` or local network).
3. **Shared Backend & AI:**
   - **Database:** Firebase Realtime Database (RTDB) with `setPersistenceEnabled(true)` and `.keepSynced(true)` on core ship state.
   - **Authentication:** Firebase Anonymous Auth paired with a **4-character Session PIN** (e.g., `AEGS`) and automatic session state restoration on reconnect. No email/password sign-ups or lobby browsers.
   - **AI Telemetry Engine:** Gemini API (`gemini-2.5-flash`) invoked strictly via **event-driven triggers** using a Referee-seeded encrypted API key stored in session metadata. **Zero freeform player chat boxes.**

## 3. Visual & UX Guardrails
- **Aesthetic:** Retro-sci-fi phosphor-green CRT terminal (`#0A0F0A` void background, `#33FF66` primary phosphor green, `#FFB000` amber warnings, `#FF3B30` critical/glitch alerts, monospace typography, subtle scanline/grid framing).
- **Navigation Lock (3 Tabs Only on Player Commlink):**
  - `[ BRIDGE ]`: Assigned ship station console (Pilot, Command, Engineer, Gunner, Sensors), shared Hull/Power/Thrust bars, and cross-station tactile Pings/Nudges.
  - `[ LOADOUT ]`: Pip-Boy style personal combat & field tracker (HP/Endurance, Armor rating, and 4–6 tappable item cards loaded from a lightweight `crew_gear.json`—no full rulebook catalog or encumbrance math). Switches to a Stabilization/Medic tracker if character Endurance hits 0.
  - `[ FEED ]`: Live chronological stream of A.R.I.A. telemetry alerts, 2D6 dice rolls, and Referee-pushed clues/item cards.
- **Two Breakpoints Only:**
  - Compact (`< 600dp` width): Single-pane Player Commlink.
  - Expanded (`>= 600dp` width / Unfolded Z Fold 8 Ultra): Dual-pane Referee Command Deck (Left Pane: live mirror of the Xbox Bridge Viewscreen; Right Pane: Referee state injectors, token movers, UWP Quick-Inject parser, and A.R.I.A. trigger controls).

## 4. Conflict-Free Firebase RTDB Schema
Isolate writes per station to prevent concurrent overwrite race conditions. Use `runTransaction()` for all shared numeric pools (`hull`, `power`, `thrustPool`).

```json
{
  "sessions": {
    "AEGS": {
      "meta": {
        "viewMode": "ORBITAL_SCAN",
        "hostileContact": false,
        "geminiKeyCipher": "<referee_seeded_encrypted_key>",
        "ariaUnlockTier": 1,
        "ariaCorrupted": false,
        "ariaSleeperTriggered": false
      },
      "shipState": {
        "hull": { "current": 80, "max": 80 },
        "power": { "available": 12, "allocated": { "mDrive": 4, "weapons": 4, "sensors": 4 } },
        "thrustPool": { "total": 4, "remaining": 4 },
        "crits": { "mDrive": 0, "powerPlant": 0, "sensors": 0, "weapons": 0, "computer": 0 }
      },
      "stations": {
        "pilot": { "assignedUid": null, "evadeActive": false, "pingTarget": null },
        "command": { "assignedUid": null, "boonTarget": null, "pingTarget": null },
        "engineer": { "assignedUid": null, "overdriveSystem": null, "pingTarget": null },
        "gunner": { "assignedUid": null, "lockedTargetId": null, "pingTarget": null },
        "sensors": { "assignedUid": null, "ewJamming": false, "secretIntel": null }
      },
      "tacticalMap": {
        "orbital": {
          "systemName": "Vespera-4",
          "uwp": "C544632-7",
          "contradictionHook": "High-output orbital refinery with zero breathable air and rationed water.",
          "anomalies": []
        },
        "spaceRadar": {
          "contacts": {}
        },
        "groundZones": {
          "nodes": {},
          "tokens": {}
        }
      },
      "feed": {}
    }
  }
}
```

## 5. Strict Scope Exclusions (Do Not Build)
- Do NOT build strict turn/phase locks that disable player buttons.
- Do NOT build a searchable *Central Supply Catalogue* database, ammo-type calculators, or weight/encumbrance systems.
- Do NOT build Google Cast / Chromecast SDK wrappers; the TV display runs natively via Xbox Edge reading `bridge-viewscreen.html`.
- Do NOT expose A.R.I.A. to unprompted player text chat; all Gemini calls originate from structured state changes or Referee triggers.
