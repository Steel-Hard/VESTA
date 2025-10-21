import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";

export default function TelaCadastroIdoso() {
  const navigation = useNavigation();
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");

  const router = useRouter();

  const handleCadastro = () => {
    if (!nome || !dataNascimento) {
      alert("Preencha todos os campos!");
      return;
    }
    alert(`Idoso ${nome} cadastrado com sucesso!`);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/register")}>
        <Text style={styles.link}>Ir para registro</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/list")}>
        <Text style={styles.link}>Lista idosos</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 30,
  },
  link: {
    color: "#7E57C2",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
