import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthContext, Hike } from "../../context/AuthContext";

export default function ProfileScreen() {
  const { user, logout, hikes, badges, deleteHike, renameHike } =
    useContext(AuthContext);

  const [profileImage, setProfileImage] = useState<string | null>(null);

  // rename model
  const [renameVisible, setRenameVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedHikeId, setSelectedHikeId] = useState<string | null>(null);

  // Badge PopUp state
  const [earnedBadge, setEarnedBadge] = useState<string | null>(null);
  const [prevBadges, setPrevBadges] = useState<string[]>([]);

  // Detect new badges
  useEffect(() => {
    if (prevBadges.length === 0) {
      setPrevBadges(badges);
      return;
    }

    const newOnes = badges.filter((b) => !prevBadges.includes(b));

    if (newOnes.length > 0) {
      setEarnedBadge(newOnes[0]);
      setPrevBadges(badges);

      setTimeout(() => setEarnedBadge(null), 3000);
    }
  }, [badges]);

  // pick image
  const pickImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    const rollPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted && !rollPermission.granted) {
      Alert.alert("Permission required", "Camera or Photo Library permission is needed.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Camera access needed.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const askChangePhoto = () => {
    Alert.alert("Change Profile Picture", "Choose an option", [
      { text: "Take Photo", onPress: openCamera },
      { text: "Choose from Library", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const askDelete = (id: string) => {
    Alert.alert("Delete Hike", "Are you sure you want to delete this hike?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteHike(id);
        },
      },
    ]);
  };

  const openRename = (id: string, currentTitle?: string) => {
    setSelectedHikeId(id);
    setNewTitle(currentTitle || "");
    setRenameVisible(true);
  };

  const saveRename = async () => {
    if (!selectedHikeId) return;
    await renameHike(selectedHikeId, newTitle.trim() || "My Hike");
    setRenameVisible(false);
  };

  const totalDistance = hikes.reduce((sum, h) => sum + (h.distanceKm || 0), 0);
  const totalHikes = hikes.length;

  const renderHike = ({ item }: { item: Hike }) => {
    const date = new Date(item.date).toLocaleString();
    const durationMin = Math.round(item.duration / 60);

    return (
      <View style={styles.hikeContainer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hikeTitle}>{item.title ?? "My Hike"}</Text>
          <Text style={styles.hikeMeta}>
            {date} • {item.distanceKm.toFixed(2)} km • {durationMin} min
          </Text>
        </View>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() =>
            Alert.alert("Options", "Choose an action", [
              {
                text: "Rename",
                onPress: () => openRename(item.id, item.title),
              },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => askDelete(item.id),
              },
              { text: "Cancel", style: "cancel" },
            ])
          }
        >
          <Ionicons name="ellipsis-vertical" size={22} color="#444" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Badge PopUp */}
      {earnedBadge && (
        <View style={styles.badgePopup}>
          <Text style={styles.badgePopupText}>New Badge Earned!</Text>
          <Text style={styles.badgePopupName}>{earnedBadge}</Text>
        </View>
      )}

      <Text style={styles.title}>My Profile</Text>

      <View style={styles.profileSection}>
        <TouchableOpacity onPress={askChangePhoto}>
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : require("../../assets/images/default-avatar.png")
            }
            style={styles.avatar}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={askChangePhoto}>
          <Text style={styles.changePhoto}>Change Photo</Text>
        </TouchableOpacity>

        {user && (
          <>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </>
        )}
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Hiking Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalHikes}</Text>
            <Text style={styles.statLabel}>Hikes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalDistance.toFixed(2)} km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
        </View>
      </View>

      {/* Badges */}
      <Text style={styles.sectionTitle}>Badges</Text>

      <View style={styles.badgeContainer}>
        {badges.length === 0 && (
          <Text style={styles.emptyText}>No badges earned yet.</Text>
        )}

        {badges.map((b) => (
          <View key={b} style={styles.badge}>
            <Text style={styles.badgeText}>{b}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Saved Hikes</Text>
      <FlatList
        data={hikes}
        keyExtractor={(item) => item.id}
        renderItem={renderHike}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No saved hikes yet.</Text>
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      />

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Modal visible={renameVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.renameBox}>
            <Text style={styles.renameTitle}>Rename Hike</Text>
            <TextInput
              style={styles.renameInput}
              placeholder="Enter new title"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <View style={styles.renameButtons}>
              <TouchableOpacity
                style={styles.renameCancel}
                onPress={() => setRenameVisible(false)}
              >
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.renameSave}
                onPress={saveRename}
              >
                <Text style={{ color: "#fff" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8", paddingTop: 48 },

  // POPUP STYLES
  badgePopup: {
    position: "absolute",
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: "#3E7C17",
    padding: 15,
    borderRadius: 12,
    zIndex: 999,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  badgePopupText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  badgePopupName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#2e4a32",
    textAlign: "center",
  },
  profileSection: { alignItems: "center", marginBottom: 16 },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#ddd",
  },
  changePhoto: {
    marginTop: 8,
    fontSize: 14,
    color: "#468c64",
    fontWeight: "600",
  },
  name: { fontSize: 20, fontWeight: "700", marginTop: 10 },
  email: { fontSize: 14, color: "#666", marginTop: 4 },

  statsContainer: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  statsTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statBox: { alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "700", color: "#468c64" },
  statLabel: { fontSize: 13 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 20,
    marginBottom: 10,
  },

  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  badge: {
    backgroundColor: "#3E7C17",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    margin: 4,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "600",
  },

  hikeContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  hikeTitle: { fontSize: 16, fontWeight: "700" },
  hikeMeta: { color: "#666", marginTop: 6 },
  menuButton: { padding: 8 },

  emptyText: { textAlign: "center", marginTop: 20, color: "#888" },

  logoutButton: {
    backgroundColor: "#d9534f",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignSelf: "center",
    marginTop: 12,
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  renameBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
  },
  renameTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  renameInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  renameButtons: { flexDirection: "row", justifyContent: "space-between" },
  renameCancel: {
    backgroundColor: "#777",
    padding: 10,
    borderRadius: 8,
    width: "45%",
    alignItems: "center",
  },
  renameSave: {
    backgroundColor: "#468c64",
    padding: 10,
    borderRadius: 8,
    width: "45%",
    alignItems: "center",
  },
});











