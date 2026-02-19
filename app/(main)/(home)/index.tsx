import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { Link, useRouter, useFocusEffect } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type MealType = "Petit-déjeuner" | "Déjeuner" | "Dîner" | "Snack";

type Food = {
  id: string;
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  quantity: number;
};

type Meal = {
  id: string;
  type: MealType;
  foods: Food[];
  date: string;
};

const DAILY_GOAL = 2000; 

const MEAL_ICONS: Record<MealType, string> = {
  "Petit-déjeuner": "🍳",
  Déjeuner: "🥗",
  Dîner: "🍽️",
  Snack: "🍎",
};

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([]);

  const todayKey = new Date().toISOString().split("T")[0]; // "2025-01-12"

  useFocusEffect(
    useCallback(() => {
      loadMeals();
    }, [])
  );

  const loadMeals = async () => {
    try {
      const stored = await AsyncStorage.getItem("meals");
      if (stored) {
        const all: Meal[] = JSON.parse(stored);
        const todayMeals = all.filter((m) => m.date === todayKey);
        setMeals(todayMeals);
      }
    } catch (e) {
      console.error(e);
    }
  };



  const totalCalories = meals.reduce((sum, meal) => {
    return (
      sum +
      meal.foods.reduce((s, f) => s + (f.calories * f.quantity) / 100, 0)
    );
  }, 0);

  const totalProteins = meals.reduce((sum, meal) => {
    return (
      sum +
      meal.foods.reduce((s, f) => s + (f.proteins * f.quantity) / 100, 0)
    );
  }, 0);

  const totalCarbs = meals.reduce((sum, meal) => {
    return (
      sum +
      meal.foods.reduce((s, f) => s + (f.carbs * f.quantity) / 100, 0)
    );
  }, 0);

  const totalFats = meals.reduce((sum, meal) => {
    return (
      sum +
      meal.foods.reduce((s, f) => s + (f.fats * f.quantity) / 100, 0)
    );
  }, 0);

  const progress = Math.min(totalCalories / DAILY_GOAL, 1);

  const todayLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <SignedIn>
          <Text style={styles.greeting}>
            👋 Bonjour {user?.firstName ?? user?.emailAddresses[0].emailAddress}
          </Text>
        </SignedIn>
        <SignedOut>
          <View style={styles.authLinks}>
            <Link href="/(auth)/sign-in">
              <Text style={styles.authLink}>Se connecter</Text>
            </Link>
            <Link href="/(auth)/signup">
              <Text style={styles.authLink}>S'inscrire</Text>
            </Link>
          </View>
        </SignedOut>
        <Text style={styles.dateLabel}>{todayLabel}</Text>
      </View>

      <View style={styles.calorieCard}>
        <Text style={styles.calorieTitle}>🔥 Calories</Text>
        <Text style={styles.calorieCount}>
          <Text style={styles.calorieMain}>{Math.round(totalCalories)}</Text>
          {" / "}{DAILY_GOAL} kcal
        </Text>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round(progress * 100)}%` as any,
                backgroundColor: progress >= 1 ? "#e74c3c" : "#4CAF50",
              },
            ]}
          />
        </View>

        <View style={styles.macros}>
          <View style={styles.macro}>
            <Text style={styles.macroValue}>{Math.round(totalProteins)}g</Text>
            <Text style={styles.macroLabel}>Protéines</Text>
          </View>
          <View style={styles.macro}>
            <Text style={styles.macroValue}>{Math.round(totalCarbs)}g</Text>
            <Text style={styles.macroLabel}>Glucides</Text>
          </View>
          <View style={styles.macro}>
            <Text style={styles.macroValue}>{Math.round(totalFats)}g</Text>
            <Text style={styles.macroLabel}>Lipides</Text>
          </View>
        </View>
      </View>


      {meals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Aucun repas ajouté aujourd'hui</Text>
          <Text style={styles.emptySubText}>
            Appuie sur ➕ pour commencer à tracker
          </Text>
        </View>
      ) : (
        meals.map((meal) => (
          <Link
            key={meal.id}
            href={`/${meal.id}`} 
            asChild 
          >
            <TouchableOpacity style={styles.mealCard}>
              <Text style={styles.mealType}>
                {MEAL_ICONS[meal.type]} {meal.type}
              </Text>
              {meal.foods.map((food) => (
                <View key={food.id} style={styles.foodRow}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodCalories}>
                    {Math.round((food.calories * food.quantity) / 100)} kcal
                  </Text>
                </View>
              ))}
            </TouchableOpacity>
          </Link>
        ))
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/add")}
      >
        <Text style={styles.addButtonText}>➕ Ajouter un repas</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  header: {
    gap: 4,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  dateLabel: {
    fontSize: 14,
    color: "#888",
    textTransform: "capitalize",
  },
  authLinks: {
    flexDirection: "row",
    gap: 16,
  },
  authLink: {
    color: "#4CAF50",
    fontWeight: "600",
    fontSize: 16,
  },
  calorieCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  calorieTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  calorieCount: {
    fontSize: 16,
    color: "#555",
  },
  calorieMain: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  progressBar: {
    height: 10,
    backgroundColor: "#eee",
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
  },
  macros: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 4,
  },
  macro: {
    alignItems: "center",
    gap: 2,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  macroLabel: {
    fontSize: 12,
    color: "#888",
  },
  mealCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  mealType: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  foodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  foodName: {
    fontSize: 14,
    color: "#444",
    flex: 1,
  },
  foodCalories: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#888",
  },
  emptySubText: {
    fontSize: 14,
    color: "#aaa",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
