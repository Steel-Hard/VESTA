import { styles } from "@/styles/";
import { Link } from "expo-router";
import React, { useState } from "react";
import Input from "@/components/Input";
import { Text, ScrollView, View, Pressable } from "react-native";

export default function SignUp() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Cadastro</Text>

      <Input
        style={styles.input}
        placeholder="Nome completo"
        value={nome}
        onChangeText={setNome}
      />
      <Input
        style={styles.input}
        placeholder="E-mail"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />
      <Input
        style={styles.input}
        placeholder="Confirmar senha"
        secureTextEntry
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
      />

      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Cadastrar</Text>
      </Pressable>

      <View style={styles.row}>
        <Text>Já tem conta?</Text>
        <Link href="/sign-in" style={styles.link}>
          Entrar na conta
        </Link>
      </View>
    </ScrollView>
  );
}
