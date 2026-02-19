import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";

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
  type: string;
  date: string;
  foods: Food[];
};

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const loadMeal = async () => {
      try {
        const stored = await AsyncStorage.getItem("meals");
        const meals: Meal[] = stored ? JSON.parse(stored) : [];

        const foundMeal = meals.find((m) => m.id === id);

        if (!foundMeal) {
          Alert.alert("Erreur", "Repas introuvable.");
          router.back();
          return;
        }

        setMeal(foundMeal);
      } catch (error) {
        Alert.alert("Erreur", "Impossible de charger le repas.");
      } finally {
        setLoading(false);
      }
    };

    loadMeal();
  }, [id]);


  const getTotals = () => {
    if (!meal) return { kcal: 0, p: 0, c: 0, f: 0 };

    let kcal = 0,
      p = 0,
      c = 0,
      f = 0;

    meal.foods.forEach((food) => {
      const factor = food.quantity / 100;

      kcal += food.calories * factor;
      p += food.proteins * factor;
      c += food.carbs * factor;
      f += food.fats * factor;
    });

    return {
      kcal: Math.round(kcal),
      p: Math.round(p),
      c: Math.round(c),
      f: Math.round(f),
    };
  };


  const deleteMeal = async () => {
    Alert.alert("Supprimer ?", "Voulez-vous supprimer ce repas ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            const stored = await AsyncStorage.getItem("meals");
            const meals: Meal[] = stored ? JSON.parse(stored) : [];

            const updatedMeals = meals.filter((m) => m.id !== id);

            await AsyncStorage.setItem("meals", JSON.stringify(updatedMeals));

            Alert.alert("✅ Supprimé", "Le repas a été supprimé.");
            router.replace("/(main)/(home)");
          } catch (error) {
            Alert.alert("Erreur", "Impossible de supprimer le repas.");
          }
        },
      },
    ]);
  };


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!meal) return null;

  const totals = getTotals();

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>{meal.type}</Text>
      <Text style={styles.date}>📅 {meal.date}</Text>

      <View style={styles.totalBox}>
        <Text style={styles.totalTitle}>Total du repas :</Text>
        <Text style={styles.totalText}>🔥 Calories : {totals.kcal} kcal</Text>
        <Text style={styles.totalText}>🥩 Protéines : {totals.p} g</Text>
        <Text style={styles.totalText}>🍞 Glucides : {totals.c} g</Text>
        <Text style={styles.totalText}>🥑 Lipides : {totals.f} g</Text>
      </View>

      <Text style={styles.subtitle}>Aliments :</Text>

      {meal.foods.map((food) => (
        <View key={food.id} style={styles.foodCard}>
          <Text style={styles.foodName}>{food.name}</Text>
          <Text style={styles.foodInfo}>
            {food.quantity}g —{" "}
            {Math.round((food.calories * food.quantity) / 100)} kcal
          </Text>

          <Text style={styles.macros}>
            P: {Math.round((food.proteins * food.quantity) / 100)}g | G:{" "}
            {Math.round((food.carbs * food.quantity) / 100)}g | L:{" "}
            {Math.round((food.fats * food.quantity) / 100)}g
          </Text>
        </View>
      ))}


      <TouchableOpacity style={styles.deleteButton} onPress={deleteMeal}>
        <Text style={styles.deleteText}>🗑 Supprimer ce repas</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  totalBox: {
    backgroundColor: "#f2f2f2",
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  totalTitle: {
    fontWeight: "700",
    marginBottom: 8,
    fontSize: 16,
  },
  totalText: {
    fontSize: 14,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  foodCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 10,
  },
  foodName: {
    fontSize: 15,
    fontWeight: "600",
  },
  foodInfo: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  macros: {
    fontSize: 12,
    marginTop: 4,
    color: "#444",
  },
  deleteButton: {
    marginTop: 20,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#e53935",
    alignItems: "center",
    marginBottom: 40,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
