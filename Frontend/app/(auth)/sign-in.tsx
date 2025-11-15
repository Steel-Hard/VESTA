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
  ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { styles } from "@/styles";
import Input from "@/components/Input";
import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import Constants from "expo-constants";
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
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = React.useState(false);

  const googleClientIds = {
    iosClientId: Constants.expoConfig?.extra?.googleIosClientId || "",
    androidClientId: Constants.expoConfig?.extra?.googleAndroidClientId || "",
    webClientId: Constants.expoConfig?.extra?.googleWebClientId || "",
  };

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: googleClientIds.iosClientId,
    androidClientId: googleClientIds.androidClientId,
    webClientId: googleClientIds.webClientId,
    redirectUri,
  });

  const handleGoogleSignIn = React.useCallback(async (accessToken: string) => {
    setIsLoadingGoogle(true);
    Keyboard.dismiss();
    try {
      await signInWithGoogle(accessToken);
      // Navega para a tela principal após login bem-sucedido
      router.replace("/(app)/elder/list");
    } catch (error) {
      const isAppError = error instanceof AppError;
      const title = isAppError
        ? error.message
        : "Não foi possível fazer login com Google. Tente novamente mais tarde";
      Alert.alert("Erro", title);
    } finally {
      setIsLoadingGoogle(false);
    }
  }, [signInWithGoogle, router]);

  React.useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleGoogleSignIn(authentication.accessToken);
      }
    } else if (response?.type === "error") {
      setIsLoadingGoogle(false);
      Alert.alert(
        "Erro",
        "Não foi possível fazer login com Google. Tente novamente."
      );
    } else if (response?.type === "cancel") {
      setIsLoadingGoogle(false);
    }
  }, [response, handleGoogleSignIn]);

  const handleGooglePress = async () => {
    setIsLoadingGoogle(true);
    try {
      await promptAsync();
    } catch (error) {
      setIsLoadingGoogle(false);
      Alert.alert("Erro", "Não foi possível abrir a autenticação do Google.");
    }
  };
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
      // Navega para a tela principal após login bem-sucedido
      router.replace("/(app)/elder/list");
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
        style={[styles.button, isLoading && { opacity: 0.6 }]}
        onPress={handleSubmit(handleSignIn, handlerError)}
        disabled={isLoading || isLoadingGoogle}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </Pressable>

      <Pressable
        style={[
          styles.button,
          { backgroundColor: "#f2f2f2" },
          (isLoadingGoogle || isLoading) && { opacity: 0.6 },
        ]}
        className="items-center flex-row justify-center gap-4"
        onPress={handleGooglePress}
        disabled={isLoading || isLoadingGoogle}
      >
        {isLoadingGoogle ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} />
            <Text className="font-bold">Faça login com Google</Text>
          </>
        )}
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
