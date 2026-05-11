import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// --- Types ---

export type RootStackParamList = {
  Map: {
    name: string;
    distance: string;
    location: string;
    difficulty: string;
    latitude: number;
    longitude: number;
    trailPath: { latitude: number; longitude: number }[];
  };
  Trails: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Trails">;

export type Trail = {
  id: string;
  name: string;
  location: string;
  distance: string;
  difficulty: string;
  coords: { latitude: number; longitude: number };
  path: { latitude: number; longitude: number }[];
};

// --- Sample Trails with rough paths ---

 export const TRAILS = [
  {
    id: "1",
    name: "Lincolnshire Wolds Walk",
    location: "Lincolnshire, UK",
    distance: "8.4 km",
    difficulty: "Moderate",
    coords: { latitude: 53.343, longitude: -0.043 },
    path: [
      { latitude: 53.343, longitude: -0.043 },
      { latitude: 53.344, longitude: -0.045 },
      { latitude: 53.345, longitude: -0.047 },
      { latitude: 53.346, longitude: -0.046 },
      { latitude: 53.347, longitude: -0.044 },
      { latitude: 53.3475, longitude: -0.042 },
      { latitude: 53.3465, longitude: -0.040 },
      { latitude: 53.345, longitude: -0.041 },
      { latitude: 53.344, longitude: -0.042 },
      { latitude: 53.343, longitude: -0.043 }, // closes the loop
    ],
  },
  {
    id: "2",
    name: "Hartsholme Park Trail",
    location: "Lincoln, UK",
    distance: "5.2 km",
    difficulty: "Easy",
    coords: { latitude: 53.210, longitude: -0.588 },
    path: [
      { latitude: 53.210, longitude: -0.588 },
      { latitude: 53.211, longitude: -0.589 },
      { latitude: 53.212, longitude: -0.590 },
      { latitude: 53.213, longitude: -0.591 },
      { latitude: 53.214, longitude: -0.592 },
      { latitude: 53.215, longitude: -0.593 },
    ],
  },
  {
    id: "3",
    name: "Whisby Nature Reserve",
    location: "Lincoln, UK",
    distance: "6.3 km",
    difficulty: "Easy",
    coords: { latitude: 53.192, longitude: -0.637 },
    path: [
      { latitude: 53.192, longitude: -0.637 },
      { latitude: 53.193, longitude: -0.638 },
      { latitude: 53.194, longitude: -0.639 },
      { latitude: 53.195, longitude: -0.640 },
      { latitude: 53.196, longitude: -0.641 },
      { latitude: 53.197, longitude: -0.642 },
    ],
  },
];


// --- Component ---

export default function TrailsScreen() {
  const navigation = useNavigation<NavigationProp>();

  const openTrail = (trail: Trail) => {
    navigation.navigate("Map", {
      name: trail.name,
      distance: trail.distance,
      location: trail.location,
      difficulty: trail.difficulty,
      latitude: trail.coords.latitude,
      longitude: trail.coords.longitude,
      trailPath: trail.path,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Suggested Trails Near You</Text>
      <FlatList
        data={TRAILS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openTrail(item)}>
            <Text style={styles.trailName}>{item.name}</Text>
            <Text style={styles.trailInfo}>
              {item.location} • {item.distance} • {item.difficulty}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}


// --- Styles ---

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 30,       // <-- added to push it down
    marginBottom: 15,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  trailName: { fontSize: 18, fontWeight: "600", color: "#1e88e5" },
  trailInfo: { color: "#555", marginTop: 4 },
});








