package tech.jacobdavis.aegisdawn.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import tech.jacobdavis.aegisdawn.model.StationRole
import tech.jacobdavis.aegisdawn.ui.components.CrtButton
import tech.jacobdavis.aegisdawn.ui.components.CrtTerminalBox
import tech.jacobdavis.aegisdawn.ui.theme.CrtAmber
import tech.jacobdavis.aegisdawn.ui.theme.CrtPhosphor
import tech.jacobdavis.aegisdawn.ui.theme.CrtPhosphorDim
import tech.jacobdavis.aegisdawn.ui.theme.CrtSurfaceElevated
import tech.jacobdavis.aegisdawn.ui.theme.CrtTextDim
import tech.jacobdavis.aegisdawn.ui.theme.CrtVoid

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SessionJoinScreen(
    onConnect: (pin: String, role: StationRole) -> Unit
) {
    var pin by remember { mutableStateOf("AEGS") }
    var selectedRole by remember { mutableStateOf(StationRole.PILOT) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(CrtVoid)
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = 520.dp)
                .fillMaxWidth()
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            CrtTerminalBox(title = "COMMLINK BOOT // RIMWARD VERGE") {
                Text(
                    text = "SS AEGIS DAWN",
                    style = MaterialTheme.typography.headlineMedium,
                    color = CrtPhosphor
                )
                Text(
                    text = "TRANSPONDER ALIAS: LUCKY BREAK",
                    style = MaterialTheme.typography.bodyMedium,
                    color = CrtAmber
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "PERMISSIVE TABLETOP TELEMETRY TERMINAL. ENTER 4-CHAR SESSION PIN AND ASSIGN BRIDGE STATION.",
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            CrtTerminalBox(title = "SESSION PIN (4-CHAR)") {
                OutlinedTextField(
                    value = pin,
                    onValueChange = { raw ->
                        pin = raw.uppercase().filter { it.isLetterOrDigit() }.take(4)
                    },
                    singleLine = true,
                    placeholder = { Text("AEGS", color = CrtPhosphorDim) },
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters),
                    textStyle = MaterialTheme.typography.headlineMedium,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = CrtPhosphor,
                        unfocusedBorderColor = CrtPhosphorDim,
                        focusedTextColor = CrtPhosphor,
                        unfocusedTextColor = CrtPhosphor,
                        cursorColor = CrtPhosphor,
                        focusedContainerColor = CrtVoid,
                        unfocusedContainerColor = CrtVoid
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
            }

            CrtTerminalBox(title = "SELECT STATION / ROLE") {
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    StationRole.entries.forEach { role ->
                        val isSelected = role == selectedRole
                        val accent = if (role == StationRole.REFEREE) CrtAmber else CrtPhosphor
                        Box(
                            modifier = Modifier
                                .background(
                                    if (isSelected) accent.copy(alpha = 0.2f) else CrtSurfaceElevated,
                                    RoundedCornerShape(2.dp)
                                )
                                .border(
                                    width = if (isSelected) 2.dp else 1.dp,
                                    color = if (isSelected) accent else CrtPhosphorDim,
                                    shape = RoundedCornerShape(2.dp)
                                )
                                .clickable { selectedRole = role }
                                .padding(horizontal = 12.dp, vertical = 10.dp)
                        ) {
                            Column {
                                Text(
                                    text = "[${role.code}]",
                                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                                    color = if (isSelected) accent else CrtTextDim
                                )
                                Text(
                                    text = role.displayName.uppercase(),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (isSelected) accent else CrtTextDim
                                )
                            }
                        }
                    }
                }
            }

            CrtButton(
                text = "[ ESTABLISH COMMLINK -> ${selectedRole.displayName.uppercase()} ]",
                onClick = { onConnect(pin, selectedRole) },
                enabled = pin.length == 4,
                filled = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            )
        }
    }
}
