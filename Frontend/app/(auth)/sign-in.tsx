import React from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  Alert,
  Keyboard,
  Image,
  ActivityIndicator,
  ToastAndroid,
  Platform,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { styles } from "@/styles";
import Input from "@/components/Input";
import { Ionicons } from "@expo/vector-icons";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { validadeSchemaSignIn } from "@/validation";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { AppError } from "@/utils/AppError";
import vestaLogo from "@/assets/images/vesta-logo.png";

type FormData = {
  email: string;
  password: string;
};

export default function SignIn() {
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = React.useState(false);

  React.useEffect(() => {
    const webClientId =
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
      process.env.EXPO_PUBLIC_CLIENT_ID ||
      "";
    const iosClientId =
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
      process.env.EXPO_PUBLIC_CLIENT_ID ||
      "";

    if (webClientId && iosClientId) {
      GoogleSignin.configure({
        webClientId: webClientId,
        iosClientId: iosClientId,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });
      console.log("Google Sign In configurado com sucesso");
      console.log("Web Client ID:", webClientId.substring(0, 30) + "...");
      console.log("iOS Client ID:", iosClientId.substring(0, 30) + "...");
    } else {
      console.warn("⚠️ GOOGLE_WEB_CLIENT_ID não encontrado no .env");
      console.warn(
        "Verifique se EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID está definido no arquivo .env"
      );
    }
  }, []);

  const handleGooglePress = async () => {
    setIsLoadingGoogle(true);
    Keyboard.dismiss();

    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const userInfo = await GoogleSignin.signIn();

      // A biblioteca retorna idToken e serverAuthCode
      const idToken = userInfo.data?.idToken;
      const serverAuthCode = userInfo.data?.serverAuthCode;

      const tokenToSend = idToken || serverAuthCode;

      if (!tokenToSend) {
        throw new Error("Token não encontrado na resposta do Google");
      }

      await signInWithGoogle(tokenToSend);

      router.replace("/(app)/elder/list");
    } catch (error: any) {
      if (
        error.code === statusCodes.SIGN_IN_CANCELLED ||
        error.code === statusCodes.IN_PROGRESS
      ) {
        return;
      }

      const isAppError = error instanceof AppError;
      const title = isAppError
        ? error.message
        : "Não foi possível fazer login com Google. Tente novamente mais tarde";
      Alert.alert("Erro", title);
    } finally {
      setIsLoadingGoogle(false);
    }
  };
  const { control, handleSubmit } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: yupResolver(validadeSchemaSignIn),
  });
  const handlerError = (error: any) => {
    if (Platform.OS === "android") {
      Object.values(error).forEach((field: any) => {
        ToastAndroid.show(field.message, ToastAndroid.SHORT);
      });
    }
  };

  const handleSignIn = async ({ email, password }: FormData) => {
    setIsLoading(true);
    Keyboard.dismiss();
    try {
      await signIn(email, password);
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
            placeholder="Senha"
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
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} />
            <Text className="font-bold">Faça login com Google</Text>
          </>
        )}
      </Pressable>
      <View style={[styles.row, { marginTop: 30, marginBottom: 40 }]}>
        <Text>Ainda não tem conta?</Text>
        <Link href="/sign-up" style={styles.link}>
          Cadastre-se
        </Link>
      </View>
    </ScrollView>
  );
}
