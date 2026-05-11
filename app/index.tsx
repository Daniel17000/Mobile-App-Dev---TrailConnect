import React, { useContext, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AuthContext } from "../context/AuthContext";

export default function Home() {
  const { signUp, login } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (isLogin) {
      const success = await login(email, password);
      if (!success) Alert.alert("Error", "Invalid login credentials");
    } else {
      await signUp(name, email, password);
      Alert.alert("Account created", "You are now logged in!");
      setIsLogin(true);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TrailConnect</Text>
      <Text style={styles.subtitle}>Your hiking companion app</Text>

      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>{isLogin ? "Login" : "Sign Up"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchText}>
          {isLogin ? "Don’t have an account? Sign up" : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "#2e8b57", marginBottom: 10 },
  subtitle: { fontSize: 16, marginBottom: 20, color: "#666" },
  input: {
    width: "90%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
  },
  button: {
    backgroundColor: "#2e8b57",
    padding: 12,
    borderRadius: 8,
    width: "90%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  switchText: { color: "#2e8b57", marginTop: 20, textDecorationLine: "underline" },
});


