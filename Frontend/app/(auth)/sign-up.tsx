import { styles } from "@/styles/";
import { Link } from "expo-router";
import React from "react";
import Input from "@/components/Input";
import {
  Text,
  ScrollView,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
} from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useForm, Controller } from "react-hook-form";
import { validateSchemaSignUp } from "@/validation";
import { yupResolver } from "@hookform/resolvers/yup";
import { api } from "@/services/api";
import { AppError } from "@/utils/AppError";

type FormData = {
  name: string;
  email: string;
  password: string;
  password_confirm: string;
};

export default function SignUp() {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirm: "",
    },
    resolver: yupResolver(validateSchemaSignUp),
  });

  const handlerError = (error: any) => {
    if (Platform.OS === "android") {
      Object.values(error).forEach((field: any) => {
        ToastAndroid.show(field.message, ToastAndroid.SHORT);
      });
    }
  };

  const handlerSignUp = async ({ name, email, password }: FormData) => {
    setIsLoading(true);
    try {
      await api.post("/auth/signup", { name, email, password });

      ToastAndroid.show("Cadastro realizado com sucesso", ToastAndroid.SHORT);

      await signIn(email, password);
    } catch (error) {
      const isAppError = error instanceof AppError;

      const title = isAppError
        ? error.message
        : "Não foi possível cadastrar. Tente novamente mais tarde";

      ToastAndroid.show(title, ToastAndroid.LONG);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: 20,
          ...styles.container,
        }}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
      >
        <Text style={styles.title}>Crie Sua Conta</Text>
        <Text style={{ textAlign: "center", marginBottom: 24, color: "#666" }}>
          Preencha seus dados para começar
        </Text>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input
              style={styles.input}
              placeholder="Nome completo"
              value={value}
              onChangeText={onChange}
              keyboardType="default"
              autoCapitalize="words"
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              style={styles.input}
              placeholder="E-mail"
              keyboardType="email-address"
              value={value}
              onChangeText={onChange}
              autoCapitalize="none"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <Input
              style={styles.input}
              placeholder="Senha"
              secureTextEntry
              value={value}
              onChangeText={onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="password_confirm"
          render={({ field: { onChange, value } }) => (
            <Input
              style={styles.input}
              placeholder="Confirmar senha"
              secureTextEntry
              value={value}
              onChangeText={onChange}
            />
          )}
        />

        <Pressable
          style={styles.button}
          onPress={handleSubmit(handlerSignUp, handlerError)}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Criando conta..." : "Criar Conta"}
          </Text>
        </Pressable>

        <View style={styles.row}>
          <Text>Já tem conta? </Text>
          <Link href="/sign-in" style={styles.link}>
            Entrar
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
