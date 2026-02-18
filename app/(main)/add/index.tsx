import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

type MealType = "Petit-déjeuner" | "Déjeuner" | "Dîner" | "Snack";

type Food = {
  id: string;
  name: string;
};

type Meal = {
  id: string;
  type: MealType;
  foods: Food[];
  date: string;
};

export default function AddMealScreen() {
  const router = useRouter();

  const [mealType, setMealType] = useState<MealType | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);

  // Charger les repas au démarrage
  useEffect(() => {
    loadMeals();
  }, []);

  // Sauvegarder les repas à chaque modification
  useEffect(() => {
    if (meals.length > 0) {
      saveMeals();
    }
  }, [meals]);

  const loadMeals = async () => {
    try {
      const storedMeals = await AsyncStorage.getItem('meals');
      if (storedMeals) {
        setMeals(JSON.parse(storedMeals));
      }
    } catch (error) {
      console.error("Erreur lors du chargement des repas:", error);
    }
  };

  const saveMeals = async () => {
    try {
      await AsyncStorage.setItem('meals', JSON.stringify(meals));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des repas:", error);
    }
  };

  const deleteMeal = async (id: string) => {
    try {
      const updatedMeals = meals.filter(meal => meal.id !== id);
      setMeals(updatedMeals);
      await AsyncStorage.setItem('meals', JSON.stringify(updatedMeals));
    } catch (error) {
      console.error("Erreur lors de la suppression du repas:", error);
    }
  };

  // 🔁 Debounce 400ms
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      searchFood(query);
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  const searchFood = async (text: string) => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
          text
        )}&search_simple=1&json=1&page_size=10`
      );
      const json = await res.json();

      const foods: Food[] = json.products
        ?.filter((p: any) => p.product_name)
        .map((p: any) => ({
          id: p.id,
          name: p.product_name,
        }));

      setResults(foods || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addFood = (food: Food) => {
    if (selectedFoods.find((f) => f.id === food.id)) return;
    setSelectedFoods((prev) => [...prev, food]);
  };

  const removeFood = (id: string) => {
    setSelectedFoods((prev) => prev.filter(food => food.id !== id));
  };

  const validateMeal = async () => {
    if (!mealType || selectedFoods.length === 0) return;

    const newMeal: Meal = {
      id: Date.now().toString(),
      type: mealType,
      foods: selectedFoods,
      date: new Date().toISOString(),
    };

    setMeals(prev => [...prev, newMeal]);
    setMealType(null);
    setSelectedFoods([]);
    setQuery("");

    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajouter un repas</Text>

      {/* 🍽 Type de repas */}
      <View style={styles.mealTypeContainer}>
        {["Petit-déjeuner", "Déjeuner", "Dîner", "Snack"].map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setMealType(type as MealType)}
            style={[
              styles.mealTypeButton,
              mealType === type && styles.mealTypeButtonActive,
            ]}
          >
            <Text
              style={[
                styles.mealTypeText,
                mealType === type && styles.mealTypeTextActive,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 🔍 Recherche */}
      <TextInput
        placeholder="Rechercher un aliment..."
        value={query}
        onChangeText={setQuery}
        style={styles.input}
      />

      {/* Résultats */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultItem}
            onPress={() => addFood(item)}
          >
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query && !loading ? <Text>Aucun résultat</Text> : null
        }
      />

      {/* 🧾 Aliments ajoutés */}
      <View style={styles.selectedContainer}>
        <Text style={styles.subtitle}>Aliments ajoutés</Text>
        {selectedFoods.map((food) => (
          <View key={food.id} style={styles.foodItem}>
            <Text>• {food.name}</Text>
            <TouchableOpacity onPress={() => removeFood(food.id)}>
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* 📷 Scanner */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => router.push("/add/camera")}
      >
        <Text style={styles.scanButtonText}>Scanner un code-barres</Text>
      </TouchableOpacity>

      {/* ✅ Valider */}
      <TouchableOpacity
        disabled={!mealType || selectedFoods.length === 0}
        style={[
          styles.validateButton,
          (!mealType || selectedFoods.length === 0) &&
            styles.validateButtonDisabled,
        ]}
        onPress={validateMeal}
      >
        <Text style={styles.validateButtonText}>Valider</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 12,
  },
  mealTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  mealTypeButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
    marginBottom: 8,
  },
  mealTypeButtonActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  mealTypeText: {
    color: "#333",
  },
  mealTypeTextActive: {
    color: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  resultItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  selectedContainer: {
    marginTop: 12,
  },
  subtitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  removeText: {
    color: 'red',
    marginLeft: 8,
  },
  scanButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#2196F3",
    borderRadius: 8,
    alignItems: "center",
  },
  scanButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  validateButton: {
    marginTop: 12,
    padding: 14,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    alignItems: "center",
  },
  validateButtonDisabled: {
    backgroundColor: "#ccc",
  },
  validateButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
