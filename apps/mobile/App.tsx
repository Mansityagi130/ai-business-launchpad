import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, View, SafeAreaView } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>AI Business Launchpad</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Mobile Companion App</Text>
        <Text style={styles.subtitle}>
          Create and manage your AI-generated websites directly from your phone.
        </Text>
      </View>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    alignItems: "center",
  },
  logo: {
    color: "#F59E0B",
    fontSize: 20,
    fontWeight: "bold",
  },
  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
