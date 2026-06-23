import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View, TouchableOpacity, SafeAreaView, Alert } from "react-native";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Input Error", "Please fill in all credentials.");
      return;
    }
    setLoading(true);
    // Simulating authentication success in Sprint 2
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Success", "Authenticated successfully.");
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to launch your business online</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#64748B"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#64748B"
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Verifying..." : "Sign In"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  form: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    color: "#CBD5E1",
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#1E293B",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  button: {
    backgroundColor: "#F59E0B",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "bold",
  },
});
