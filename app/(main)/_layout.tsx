import { Redirect, Tabs } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'

export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth()

  if (!isSignedIn) {
    return <Redirect href={'/signup'} />
  }

  return (
    <Tabs>
      <Tabs.Screen name='(home)' options={{
        title: "Repas",
        headerShown: false
      }} />
      <Tabs.Screen name='add' options={{
        title: "Ajouter"
      }} />
      <Tabs.Screen name='profile' options={{
        title: "Profil"
      }} />
    </Tabs>
  )
}