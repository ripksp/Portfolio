package tech.jakedavis.aegisdawn.data

import tech.jakedavis.aegisdawn.model.GroundNode
import tech.jakedavis.aegisdawn.model.GroundToken
import tech.jakedavis.aegisdawn.model.GroundZonePreset
import tech.jakedavis.aegisdawn.model.GroundZonesState

object GroundZonePresets {

    fun build(preset: GroundZonePreset): GroundZonesState = when (preset) {
        GroundZonePreset.SHIP_BOARDING -> GroundZonesState(
            nodes = mapOf(
                "airlock" to GroundNode("airlock", "AIRLOCK 01", 0.20f, 0.50f, listOf("cargo")),
                "cargo" to GroundNode("cargo", "CARGO BAY", 0.48f, 0.30f, listOf("airlock", "reactor", "bridge")),
                "reactor" to GroundNode("reactor", "REACTOR SPINE", 0.52f, 0.74f, listOf("cargo", "bridge")),
                "bridge" to GroundNode("bridge", "AUX BRIDGE", 0.82f, 0.50f, listOf("cargo", "reactor"))
            ),
            tokens = mapOf(
                "declan" to GroundToken("declan", "VANCE", "airlock", isHostile = false),
                "kallie" to GroundToken("kallie", "REYES", "cargo", isHostile = false),
                "hostile_1" to GroundToken("hostile_1", "SECURITY", "bridge", isHostile = true)
            )
        )

        GroundZonePreset.ORBITAL_REFINERY -> GroundZonesState(
            nodes = mapOf(
                "umbilical" to GroundNode("umbilical", "UMBILICAL DOCK", 0.18f, 0.50f, listOf("smelting")),
                "smelting" to GroundNode("smelting", "SMELTING DECK", 0.46f, 0.30f, listOf("umbilical", "cryo", "tower")),
                "cryo" to GroundNode("cryo", "CRYO MANIFOLD", 0.50f, 0.74f, listOf("smelting", "tower")),
                "tower" to GroundNode("tower", "CONTROL TOWER", 0.82f, 0.48f, listOf("smelting", "cryo"))
            ),
            tokens = mapOf(
                "declan" to GroundToken("declan", "VANCE", "umbilical", isHostile = false),
                "turok" to GroundToken("turok", "TUROK", "umbilical", isHostile = false),
                "corp_1" to GroundToken("corp_1", "CORP GUARD", "smelting", isHostile = true),
                "corp_2" to GroundToken("corp_2", "WARDEN", "tower", isHostile = true)
            )
        )

        GroundZonePreset.BIO_LAB_VAULT -> GroundZonesState(
            nodes = mapOf(
                "decon" to GroundNode("decon", "DECON LOCK", 0.18f, 0.50f, listOf("wing")),
                "wing" to GroundNode("wing", "CONTAINMENT", 0.46f, 0.30f, listOf("decon", "vents", "vault")),
                "vents" to GroundNode("vents", "VENT SHAFT", 0.52f, 0.74f, listOf("wing", "vault")),
                "vault" to GroundNode("vault", "SPECIMEN VAULT", 0.82f, 0.50f, listOf("wing", "vents"))
            ),
            tokens = mapOf(
                "declan" to GroundToken("declan", "VANCE", "decon", isHostile = false),
                "mercer" to GroundToken("mercer", "MERCER", "decon", isHostile = false),
                "specimen" to GroundToken("specimen", "CHIMERA", "vault", isHostile = true)
            )
        )
    }
}
