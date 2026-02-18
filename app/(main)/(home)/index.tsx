import { SignedIn, SignedOut, useSession, useUser } from '@clerk/clerk-expo'
import { Link } from 'expo-router'
import { StyleSheet, View, Text } from 'react-native'

export default function Page() {
  const { user } = useUser()

  // If your user isn't appearing as signed in,
  // it's possible they have session tasks to complete.
  // Learn more: https://clerk.com/docs/guides/configure/session-tasks
  const { session } = useSession()
  console.log(session?.currentTask)

  return (
    <View style={styles.container}>
      <Text>Welcome!</Text>
      {/* Show the sign-in and sign-up buttons when the user is signed out */}
      <SignedOut>
        <Link href="/(auth)/sign-in">
          <Text>Sign in</Text>
        </Link>
        <Link href="/(auth)/signup">
          <Text>Sign up</Text>
        </Link>
      </SignedOut>
      {/* Show the sign-out button when the user is signed in */}
      <SignedIn>
        <Text>Hello {user?.emailAddresses[0].emailAddress}</Text>

      </SignedIn>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
})