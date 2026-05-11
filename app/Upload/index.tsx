import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import React, { useContext, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthContext, Post } from "../../context/AuthContext";

export default function Upload() {
  const { refreshForumPosts } = useContext(AuthContext);

  const [posts, setPosts] = useState<Post[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newText, setNewText] = useState("");
  const [newImage, setNewImage] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      const saved = await AsyncStorage.getItem("forumPosts");
      if (saved) setPosts(JSON.parse(saved));
    };
    loadPosts();

    (async () => {
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  const savePosts = async (updated: Post[]) => {
    setPosts(updated);
    await AsyncStorage.setItem("forumPosts", JSON.stringify(updated));
    await refreshForumPosts(); // update AuthContext so badges refresh
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setNewImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setNewImage(result.assets[0].uri);
    }
  };

  const addPost = async () => {
    if (!newText.trim() && !newImage) return;

    const newPost: Post = {
      id: Date.now().toString(),
      text: newText,
      image: newImage || undefined,
    };

    const updated = [newPost, ...posts];
    await savePosts(updated);

    setNewText("");
    setNewImage(null);
    setModalVisible(false);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.card}>
      {item.image && <Image source={{ uri: item.image }} style={styles.image} />}
      <Text style={styles.postText}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>TrailConnect Forum</Text>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No posts yet. Be the first to share your hike!
          </Text>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create a Post</Text>
            <ScrollView>
              <TextInput
                placeholder="Write something about your hike..."
                style={styles.input}
                multiline
                value={newText}
                onChangeText={setNewText}
              />

              {newImage && (
                <Image source={{ uri: newImage }} style={styles.previewImage} />
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
                  <Ionicons name="image-outline" size={24} color="#3E7C17" />
                  <Text style={styles.buttonText}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconButton} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={24} color="#3E7C17" />
                  <Text style={styles.buttonText}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconButton} onPress={addPost}>
                  <Ionicons name="send" size={24} color="#3E7C17" />
                  <Text style={styles.buttonText}>Post</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 15,
    color: "#2E3A59",
  },
  card: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  postText: {
    fontSize: 16,
    color: "#333",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#3E7C17",
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3E7C17",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  buttonText: {
    color: "#3E7C17",
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#B00020",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    color: "#888",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
});




