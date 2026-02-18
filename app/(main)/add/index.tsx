import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
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

export default function AddMealScreen() {
  const router = useRouter();
  const { scannedFood, mealType: scannedMealType } = useLocalSearchParams();

  const [mealType, setMealType] = useState<MealType | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ✅ Récupère le mealType envoyé depuis la caméra
  useEffect(() => {
    if (scannedMealType) {
      setMealType(scannedMealType as MealType);
    }
  }, [scannedMealType]);

  // ✅ Récupère l'aliment scanné depuis la caméra
  useEffect(() => {
    if (scannedFood) {
      const food = JSON.parse(scannedFood as string);
      setSelectedFoods((prev) => {
        if (prev.find((f) => f.id === food.id)) return prev;
        return [...prev, food];
      });
    }
  }, [scannedFood]);

  // ✅ Handler du TextInput avec debounce + abort
  const handleSearch = (text: string) => {
    setQuery(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      searchFood(text);
    }, 500);
  };

  // ✅ Fetch avec AbortController pour éviter les race conditions
  const searchFood = async (text: string) => {
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);

      if (abortRef.current) abortRef.current.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      setTimeout(() => controller.abort(), 4000);

      const url =
        `https://fr.openfoodfacts.org/cgi/search.pl?` +
        `search_terms=${encodeURIComponent(text)}` +
        `&search_simple=1&action=process&json=1` +
        `&fields=code,product_name,product_name_fr,nutriments` +
        `&page_size=10`;

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "CalorieTracker/1.0",
          Accept: "application/json",
        },
      });

      const data = await res.json();

      const foods: Food[] = (data.products ?? []).map((p: any) => {
        const nutr = p.nutriments ?? {};

        return {
          id: p.code,
          name: p.product_name_fr || p.product_name || "Inconnu",
          calories: Math.round(
            nutr["energy-kcal_100g"] ?? nutr.energy_kcal_100g ?? 0
          ),
          proteins: Math.round(nutr.proteins_100g ?? 0),
          carbs: Math.round(nutr.carbohydrates_100g ?? 0),
          fats: Math.round(nutr.fat_100g ?? 0),
          quantity: 100,
        };
      });

      setResults(foods);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        Alert.alert("Erreur", "Recherche impossible.");
      }
    } finally {
      setLoading(false);
    }
  };

  const addFood = (food: Food) => {
    if (selectedFoods.find((f) => f.id === food.id)) return;
    setSelectedFoods([...selectedFoods, food]);
    setQuery("");
    setResults([]);
  };

  const removeFood = (id: string) => {
    setSelectedFoods(selectedFoods.filter((f) => f.id !== id));
  };

  const updateQuantity = (id: string, quantity: string) => {
    const qty = parseInt(quantity) || 0;
    setSelectedFoods(
      selectedFoods.map((f) => (f.id === id ? { ...f, quantity: qty } : f))
    );
  };

  const validateMeal = async () => {
    if (!mealType || selectedFoods.length === 0) return;

    const newMeal: Meal = {
      id: Date.now().toString(),
      type: mealType,
      foods: selectedFoods,
      date: new Date().toISOString().split("T")[0],
    };

    try {
      const stored = await AsyncStorage.getItem("meals");
      const meals: Meal[] = stored ? JSON.parse(stored) : [];
      meals.push(newMeal);
      await AsyncStorage.setItem("meals", JSON.stringify(meals));
      Alert.alert("✅ Succès", "Repas ajouté !");
      router.replace("/(main)/(home)");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder le repas.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ajouter un repas</Text>

      {/* Type de repas */}
      <View style={styles.mealTypeContainer}>
        {(["Petit-déjeuner", "Déjeuner", "Dîner", "Snack"] as MealType[]).map(
          (type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.mealTypeButton,
                mealType === type && styles.mealTypeButtonActive,
              ]}
              onPress={() => setMealType(type)}
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
          )
        )}
      </View>

      {/* Recherche */}
      <TextInput
        style={styles.input}
        placeholder="Rechercher un aliment..."
        value={query}
        onChangeText={handleSearch} // ✅ handleSearch au lieu de setQuery
      />

      {loading && <Text style={styles.loadingText}>Recherche en cours...</Text>}

      {/* Résultats */}
      {results.map((food) => (
        <TouchableOpacity
          key={food.id}
          style={styles.resultItem}
          onPress={() => addFood(food)}
        >
          <Text style={styles.resultName}>{food.name}</Text>
          <Text style={styles.resultInfo}>
            {food.calories} kcal | P: {food.proteins}g | G: {food.carbs}g | L:{" "}
            {food.fats}g
          </Text>
        </TouchableOpacity>
      ))}

      {/* Aliments sélectionnés */}
      {selectedFoods.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.subtitle}>Aliments sélectionnés :</Text>
          {selectedFoods.map((food) => (
            <View key={food.id} style={styles.foodItem}>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{food.name}</Text>
                <Text style={styles.foodMacros}>
                  {Math.round((food.calories * food.quantity) / 100)} kcal
                </Text>
              </View>
              <View style={styles.foodActions}>
                <TextInput
                  style={styles.quantityInput}
                  keyboardType="numeric"
                  value={food.quantity.toString()}
                  onChangeText={(val) => updateQuantity(food.id, val)}
                />
                <Text style={styles.gramText}>g</Text>
                <TouchableOpacity onPress={() => removeFood(food.id)}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Scanner */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() =>
          router.push({
            pathname: "/add/camera",
            params: { mealType: mealType ?? "" },
          })
        }
      >
        <Text style={styles.scanButtonText}>📷 Scanner un code-barres</Text>
      </TouchableOpacity>

      {/* Valider */}
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
    </ScrollView>
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
  loadingText: {
    color: "#999",
    marginBottom: 8,
    fontStyle: "italic",
  },
  resultItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  resultName: {
    fontSize: 15,
    fontWeight: "500",
  },
  resultInfo: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  selectedContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontWeight: "600",
    marginBottom: 8,
    fontSize: 16,
  },
  foodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontWeight: "500",
  },
  foodMacros: {
    fontSize: 12,
    color: "#888",
  },
  foodActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 4,
    width: 50,
    textAlign: "center",
  },
  gramText: {
    marginHorizontal: 4,
    color: "#666",
  },
  removeText: {
    color: "red",
    marginLeft: 8,
    fontSize: 16,
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
    marginBottom: 32,
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
