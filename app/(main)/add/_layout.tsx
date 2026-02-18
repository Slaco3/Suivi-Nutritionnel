// app/(main)/add/_layout.tsx
import { Slot, Stack } from 'expo-router'

export default function AddLayout() {
  return (
    <Stack>
      {/* Index reste à la racine du stack add */}
      <Stack.Screen name="index" options={{ title: "Ajouter un repas" }} />
      {/* Camera est une route du stack, pas une tab */}
      <Stack.Screen name="camera" options={{ title: "Scanner un code-barres" }} />
    </Stack>
    // <Stack/>
  )
}
