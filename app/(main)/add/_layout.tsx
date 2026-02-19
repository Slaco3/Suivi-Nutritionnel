// app/(main)/add/_layout.tsx
import { Slot, Stack } from 'expo-router'

export default function AddLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Ajouter un repas" }} />
      <Stack.Screen name="camera" options={{ title: "Scanner un code-barres" }} />
    </Stack>
  )
}
