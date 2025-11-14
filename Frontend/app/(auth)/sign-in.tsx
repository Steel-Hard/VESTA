import React from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  Alert,
  Keyboard,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link } from "expo-router";
import { styles } from "@/styles";
import Input from "@/components/Input";
import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { validadeSchemaSignIn } from "@/validation";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { AppError } from "@/utils/AppError";
import vestaLogo from "@/assets/images/vesta-logo.png";
WebBrowser.maybeCompleteAuthSession();
const redirectUri = makeRedirectUri();
type FormData = {
  email: string;
  password: string;
};
export default function SignIn() {
  //const router = useRouter();
  const { signIn } = useAuth();

  const [request, response, promptAsync] = Google.useAuthRequest({
     iosClientId: "",
    androidClientId: "",
    webClientId: "",
    redirectUri,
  });

  // useEffect(() => {
  //   if (response?.type === "success") {
  //     const { authentication } = response;
  //     // Use o 'authentication.accessToken' para fazer chamadas à API do Google
  //     // ou envie-o para seu backend para autenticação.
  //     console.log("Token de autenticação:", authentication?.accessToken);
  //   }
  // }, [response]);

  //const signInWithGoogle = async () => {};

  const [isLoading, setIsLoading] = React.useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: yupResolver(validadeSchemaSignIn),
  });
  const handlerError = (error: any) => console.log("Form Errors:", error);

  const handleSignIn = async ({ email, password }: FormData) => {
    setIsLoading(true);
    Keyboard.dismiss();
    try {
      await signIn(email, password);
    } catch (error) {
      const isAppError = error instanceof AppError;

      const title = isAppError
        ? error.message
        : "Não foi fazer login. Tente novamente mais tarde";

      Alert.alert("Erro", title);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Image className="w-2/4 h-60" source={vestaLogo} />
      <Text style={styles.title}>Seja bem vindo!</Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <Input
            placeholder="E-mail"
            value={value}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <Input
            placeholder="Password"
            autoCapitalize="none"
            secureTextEntry
            value={value}
            onChangeText={onChange}
            onSubmitEditing={handleSubmit(handleSignIn)}
          />
        )}
      />
      <Pressable
        style={styles.button}
        onPress={handleSubmit(handleSignIn, handlerError)}
      >
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
