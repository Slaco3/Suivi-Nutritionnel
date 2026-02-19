import { Redirect, Tabs } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { MaterialIcons } from '@expo/vector-icons'

export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth()

  if (!isSignedIn) {
    return <Redirect href={'/signup'} />
  }

  return (
    <Tabs>
      <Tabs.Screen name='(home)' options={{
        title: "Repas",
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="restaurant-menu" size={size} color={color} />
        ),
      }} />
      <Tabs.Screen name='add' options={{
        title: "Ajouter",
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="add-circle" size={size} color={color} />
        ),
      }} />
      <Tabs.Screen name='profile' options={{
        title: "Profil",
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="person" size={size} color={color} />
        ),
      }} />
    </Tabs>
  )
}