package tech.jakedavis.aegisdawn.data

import android.content.Context
import org.json.JSONObject

data class EquippedArmor(
    val name: String = "Salvaged Vacc Suit",
    val rating: Int = 4,
    val trait: String = "Vacuum-sealed."
)

data class GearCard(
    val id: String,
    val name: String,
    val category: String,
    val effect: String,
    val range: String,
    val trait: String,
    val rollMod: Int = 0
)

data class CrewLoadoutData(
    val armor: EquippedArmor = EquippedArmor(),
    val items: List<GearCard> = emptyList()
)

object CrewGearLoader {

    fun loadFromAssets(context: Context): CrewLoadoutData {
        val raw = runCatching {
            context.assets.open("crew_gear.json").bufferedReader().use { it.readText() }
        }.getOrNull() ?: return CrewLoadoutData()
        return parseJson(raw)
    }

    fun parseJson(rawJson: String): CrewLoadoutData {
        return runCatching {
            val root = JSONObject(rawJson)
            val armorObj = root.optJSONObject("armor")
            val armor = if (armorObj != null) {
                EquippedArmor(
                    name = armorObj.optString("name", "Vacc Suit"),
                    rating = armorObj.optInt("rating", 4),
                    trait = armorObj.optString("trait", "")
                )
            } else {
                EquippedArmor()
            }

            val itemsArr = root.optJSONArray("items")
            val items = buildList {
                if (itemsArr != null) {
                    for (i in 0 until itemsArr.length()) {
                        val obj = itemsArr.optJSONObject(i) ?: continue
                        add(
                            GearCard(
                                id = obj.optString("id", "item_$i"),
                                name = obj.optString("name", "Gear"),
                                category = obj.optString("category", "GEAR"),
                                effect = obj.optString("effect", "—"),
                                range = obj.optString("range", "Touch"),
                                trait = obj.optString("trait", ""),
                                rollMod = obj.optInt("rollMod", 0)
                            )
                        )
                    }
                }
            }
            CrewLoadoutData(armor = armor, items = items)
        }.getOrDefault(CrewLoadoutData())
    }
}
