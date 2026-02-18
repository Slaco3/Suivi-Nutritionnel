import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

export default function CameraScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);

    const { mealType } = useLocalSearchParams();

    useFocusEffect(
        React.useCallback(() => {
            setScanned(false);
        }, [])
    );

    // 🔐 Vérification permission
    if (!permission) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.centered}>
                <Text style={styles.permissionText}>
                    L'accès à la caméra est nécessaire pour scanner un code-barres.
                </Text>
                <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={requestPermission}
                >
                    <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // 📷 Scan du code-barres
    const handleBarCodeScanned = async ({
        type,
        data,
    }: {
        type: string;
        data: string;
    }) => {
        if (scanned || loading) return;
        setScanned(true);
        setLoading(true);

        try {
            const response = await fetch(
                `https://fr.openfoodfacts.org/api/v2/product/${data}.json?fields=product_name,product_name_fr,nutriments`,
                {
                    headers: {
                        "User-Agent": "CalorieTracker/1.0",
                        Accept: "application/json",
                    },
                }
            );

            const json = await response.json();

            if (json.status === 0 || !json.product) {
                Alert.alert(
                    "Produit introuvable",
                    "Ce code-barres n'est pas dans notre base de données.",
                    [{ text: "Réessayer", onPress: () => setScanned(false) }]
                );
                return;
            }

            const p = json.product;
            const nutr = p.nutriments ?? {};

            const food = {
                id: data,
                name: p.product_name_fr || p.product_name || "Produit inconnu", // ← fallback FR
                calories: Math.round(
                    nutr["energy-kcal_100g"] ?? nutr.energy_kcal_100g ?? 0
                ),
                proteins: Math.round(p.nutriments?.proteins_100g ?? 0),
                carbs: Math.round(p.nutriments?.carbohydrates_100g ?? 0),
                fats: Math.round(p.nutriments?.fat_100g ?? 0),
                quantity: 100,
            };

            router.replace({
                pathname: "/add",
                params: {
                    scannedFood: JSON.stringify(food),
                    mealType: mealType as string,
                },
            });
        } catch (error) {
            console.error("Erreur fetch:", error); // ← pour débugger
            Alert.alert(
                "Erreur",
                "Impossible de récupérer les informations du produit.",
                [{ text: "Réessayer", onPress: () => setScanned(false) }]
            );
        } finally {
            setLoading(false);
        }
    };


    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: [
                        "ean13",
                        "ean8",
                        "upc_a",
                        "upc_e",
                        "code128",
                        "code39",
                    ],
                }}
            >
                {/* 🎯 Viseur */}
                <View style={styles.overlay}>
                    <View style={styles.topOverlay} />
                    <View style={styles.middleRow}>
                        <View style={styles.sideOverlay} />
                        <View style={styles.scanWindow}>
                            {/* Coins du viseur */}
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                        </View>
                        <View style={styles.sideOverlay} />
                    </View>
                    <View style={styles.bottomOverlay}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#fff" />
                        ) : (
                            <Text style={styles.instructionText}>
                                {scanned
                                    ? "Produit trouvé ✅"
                                    : "Placez le code-barres dans le cadre"}
                            </Text>
                        )}

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.cancelButtonText}>Annuler</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </CameraView>
        </View>
    );
}

const SCAN_WINDOW_SIZE = 250;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: "#fff",
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
    },
    topOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
    },
    middleRow: {
        flexDirection: "row",
        height: SCAN_WINDOW_SIZE,
    },
    sideOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
    },
    scanWindow: {
        width: SCAN_WINDOW_SIZE,
        height: SCAN_WINDOW_SIZE,
        backgroundColor: "transparent",
    },
    bottomOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        alignItems: "center",
        paddingTop: 24,
        gap: 16,
    },
    instructionText: {
        color: "#fff",
        fontSize: 16,
        textAlign: "center",
    },
    corner: {
        position: "absolute",
        width: 20,
        height: 20,
        borderColor: "#4CAF50",
        borderWidth: 3,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    permissionText: {
        textAlign: "center",
        marginBottom: 16,
        fontSize: 16,
        color: "#333",
    },
    permissionButton: {
        backgroundColor: "#4CAF50",
        padding: 12,
        borderRadius: 8,
    },
    permissionButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
    cancelButton: {
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#fff",
    },
    cancelButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
});
