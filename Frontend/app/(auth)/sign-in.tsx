import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { Link, useRouter } from "expo-router";
import { styles } from "@/styles";
import Input from "@/components/Input";
import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();
const redirectUri = makeRedirectUri();

export default function SignIn() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "",
    webClientId: "",
    redirectUri,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      // Use o 'authentication.accessToken' para fazer chamadas à API do Google
      // ou envie-o para seu backend para autenticação.
      console.log("Token de autenticação:", authentication?.accessToken);
    }
  }, [response]);

  const handleSignIn = async () => {
    // TODO: implement sign-up
    router.push("/(app)/home");
  };

  const signInWithGoogle = async () => {};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Seja bem vindo!</Text>

      <Input
        style={styles.input}
        placeholder="E-mail"
        value={email}
        keyboardType="email-address"
        onChangeText={setEmail}
      />

      <Input
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.button} onPress={handleSignIn}>
        <Text style={styles.buttonText}>Entrar</Text>
      </Pressable>

      <Pressable
        style={[styles.button, { backgroundColor: "#f2f2f2" }]}
        className="items-center flex-row justify-center gap-4"
        onPress={() => {
          promptAsync();
        }}
      >
        <Ionicons name="logo-google" size={20} />
        <Text className="font-bold">Faça login com Google</Text>
      </Pressable>
      <View style={styles.row}>
        <Text>Ainda não tem conta?</Text>
        <Link href="/sign-up" style={styles.link}>
          Cadastre-se
        </Link>
      </View>
    </ScrollView>
  );
}
