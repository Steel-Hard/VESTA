import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Listas() {
  const router = useRouter();

  const idosos = [
    { id: 1, nome: "Monise Souza" },
    { id: 2, nome: "Aurélio Fernandes" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Idosos</Text>

      {idosos.map((idoso) => (
        <View key={idoso.id} style={styles.card}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#7E57C2" />
          </View>
          <Text style={styles.nome}>{idoso.nome}</Text>
        </View>
      ))}
      {/* AQUI É ONDE IRÁ APARECER OS IDOSO CADASTRADOS  */}
      <View style={styles.placeholder} />

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/register")}
      >
        <Text style={styles.buttonText}>Adicionar Idoso</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 30,
  },
  card: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F4F4",
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E9E9E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  nome: {
    fontSize: 16,
    fontWeight: "500",
  },
  placeholder: {
    height: 50, 
  },
  button: {
    width: "100%",
    height: 45,
    backgroundColor: "#7E57C2",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
