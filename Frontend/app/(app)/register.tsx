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
      <Text style={styles.title}>Cadastro de Idoso</Text>

      <View style={styles.iconContainer}>
        <Ionicons name="add" size={50} color="#9E9E9E" />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Nome completo"
        value={nome}
        onChangeText={setNome}
      />

      <TextInput
        style={styles.input}
        placeholder="Data de nascimento"
        value={dataNascimento}
        onChangeText={setDataNascimento}
      />

      <TouchableOpacity style={styles.button} onPress={handleCadastro}>
        <Text style={styles.buttonText}>Cadastrar Idoso</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
        <Text style={styles.link}>Retornar para o Login</Text>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F1F1F1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    height: 45,
    backgroundColor: "#F4F4F4",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  button: {
    width: "100%",
    height: 45,
    backgroundColor: "#7E57C2",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  link: {
    color: "#7E57C2",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
