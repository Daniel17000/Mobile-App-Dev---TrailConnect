import { RouteProp, useRoute } from "@react-navigation/native";
import * as Location from "expo-location";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";
import { AuthContext } from "../../context/AuthContext";

// import trails directly from Trails screen
import { TRAILS } from "../Trails";

type Coord = { latitude: number; longitude: number };

type RootStackParamList = {
  Map: {
    name: string;
    distance: string;
    location: string;
    difficulty: string;
    latitude: number;
    longitude: number;
    trailPath: Coord[];
  };
};

type MapRouteProp = RouteProp<RootStackParamList, "Map">;

export default function MapScreen() {
  const { user, addHike } = useContext(AuthContext);
  const route = useRoute<MapRouteProp>();
  const params = route.params;

  const [region, setRegion] = useState<Region>({
    latitude: 53.2307,
    longitude: -0.5406,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [trailPath, setTrailPath] = useState<Coord[]>([]);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [distance, setDistance] = useState(0);
  const [path, setPath] = useState<Coord[]>([]);

  // elevation gain
  const [elevationGain, setElevationGain] = useState(0);
  const lastAltitudeRef = useRef<number | null>(null);

  const lastPointRef = useRef<Coord | null>(null);
  const locSubRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const mapRef = useRef<MapView>(null);

  const MIN_PACE_DISTANCE_KM = 0.05; // 50 meters

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const trailColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "#34a853";
      case "Moderate":
        return "#f4a261";
      case "Hard":
        return "#d32f2f";
      default:
        return "#34a853";
    }
  };

  useEffect(() => {
    if (params?.latitude && params?.longitude) {
      setRegion((r) => ({ ...r, latitude: params.latitude, longitude: params.longitude }));
    }

    if (params?.trailPath) {
      setTrailPath(params.trailPath);

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(params.trailPath, {
          edgePadding: { top: 80, bottom: 80, left: 40, right: 40 },
          animated: true,
        });
      }, 300);
    }
  }, [params]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const pos = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = pos.coords;
      setRegion((r) => ({ ...r, latitude, longitude }));
    })();

    return () => {
      if (locSubRef.current) locSubRef.current.remove();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startTracking = async () => {
    if (!user) {
      Alert.alert("Not logged in", "Please log in to save hikes.");
      return;
    }

    setPath([]);
    setDistance(0);
    setTimer(0);
    setElevationGain(0);
    lastPointRef.current = null;
    lastAltitudeRef.current = null;

    intervalRef.current = setInterval(() => setTimer((t) => t + 1), 1000);

    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Highest, distanceInterval: 2 },
      (loc) => {
        const { latitude, longitude, altitude } = loc.coords;

        setRegion((r) => ({ ...r, latitude, longitude }));

        const newPoint = { latitude, longitude };
        setPath((prev) => [...prev, newPoint]);

        // Distance calculation
        if (lastPointRef.current) {
          const d = getDistanceKm(
            lastPointRef.current.latitude,
            lastPointRef.current.longitude,
            latitude,
            longitude
          );
          setDistance((prev) => prev + d);
        }
        lastPointRef.current = newPoint;

        // Elevation gain calculation
        if (altitude != null) {
          if (lastAltitudeRef.current != null) {
            const diff = altitude - lastAltitudeRef.current;
            if (diff > 1.5) {
              setElevationGain((prev) => prev + diff);
            }
          }
          lastAltitudeRef.current = altitude;
        }
      }
    );

    locSubRef.current = sub;
    setIsRunning(true);
  };

  const stopTracking = async () => {
    if (locSubRef.current) {
      locSubRef.current.remove();
      locSubRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);

    if (user && path.length > 0) {
      try {
        await addHike({
          userEmail: user.email,
          duration: timer,
          distanceKm: Number(distance.toFixed(3)),
          elevationGain: Number(elevationGain.toFixed(0)),
          path,
          title: `Hike ${new Date().toLocaleString()}`,
        });
        Alert.alert("Hike saved", "Your hike was saved.");

         // Reset UI after saving
      setTimer(0);
      setDistance(0);
      setPath([]);
      setElevationGain(0);
      lastPointRef.current = null;
      lastAltitudeRef.current = null;

      
      } catch (error) {
        Alert.alert("Save failed", "Unable to save hike.");
      }
    }
  };

  const onPinPress = (trail: any) => {
    setTrailPath(trail.path);

    mapRef.current?.fitToCoordinates(trail.path, {
      edgePadding: { top: 80, bottom: 80, left: 40, right: 40 },
      animated: true,
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        showsUserLocation
        followsUserLocation={isRunning}
      >
        {TRAILS.map((trail) => (
          <Marker
            key={trail.id}
            coordinate={trail.coords}
            title={trail.name}
            description={trail.location}
            pinColor={trailColor(trail.difficulty)}
            onPress={() => onPinPress(trail)}
          />
        ))}

        {trailPath.length > 0 && (
          <Polyline coordinates={trailPath} strokeWidth={5} strokeColor="#000" />
        )}

        <Polyline coordinates={path} strokeWidth={5} strokeColor="#1e88e5" />
      </MapView>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Live Hike Tracking</Text>
        <Text style={styles.timer}>{formatTime(timer)}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{distance.toFixed(2)} km</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pace</Text>
            <Text style={styles.statValue}>
              {distance > MIN_PACE_DISTANCE_KM
                ? (timer / 60 / distance).toFixed(1)
                : "--"} min/km
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Elevation Gain</Text>
            <Text style={styles.statValue}>{elevationGain.toFixed(0)} m</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={isRunning ? stopTracking : startTracking}
          style={[styles.button, isRunning ? styles.stopBtn : styles.startBtn]}
        >
          <Text style={styles.buttonText}>
            {isRunning ? "Stop & Save" : "Start Hike"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  panel: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 18,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  panelTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  timer: { fontSize: 40, fontWeight: "800", textAlign: "center", marginBottom: 15 },
  statsRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 20 },
  statCard: {
    backgroundColor: "#f7f9fc",
    padding: 12,
    borderRadius: 14,
    width: "30%",
    alignItems: "center",
  },
  statLabel: { fontSize: 12, color: "#777" },
  statValue: { fontSize: 20, fontWeight: "700" },
  button: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  startBtn: { backgroundColor: "#1e88e5" },
  stopBtn: { backgroundColor: "#d32f2f" },
  buttonText: { color: "white", fontSize: 18, fontWeight: "700" },
});



