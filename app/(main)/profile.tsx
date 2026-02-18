import { SignedIn, SignedOut, useUser, useAuth } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";

export default function Page() {
  const { user } = useUser();
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text>Welcome!</Text>

      {/* Quand l'utilisateur est déconnecté */}
      <SignedOut>
        <Link href="/(auth)/sign-in">
          <Text style={styles.link}>Sign in</Text>
        </Link>

        <Link href="/(auth)/signup">
          <Text style={styles.link}>Sign up</Text>
        </Link>
      </SignedOut>

      {/* Quand l'utilisateur est connecté */}
      <SignedIn>
        <Text style={styles.email}>
          Hello {user?.emailAddresses[0].emailAddress}
        </Text>

        {/* ✅ Bouton Sign Out */}
        <TouchableOpacity style={styles.button} onPress={() => signOut()}>
          <Text style={styles.buttonText}>Sign out</Text>
        </TouchableOpacity>
      </SignedIn>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  link: {
    fontSize: 16,
    color: "blue",
  },
  email: {
    fontSize: 18,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "red",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
