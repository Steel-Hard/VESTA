import { styles } from "@/styles/";
import { Link } from "expo-router";
import React from "react";
import Input from "@/components/Input";
import {
  Text,
  ScrollView,
  View,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
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

  //TODO:  verificar com algum componente toast ou alerta ou aviso na tela
  const handlerError = (error: any) => console.log("Form Errors:", error);

  const handlerSignUp = async ({ name, email, password }: FormData) => {
    setIsLoading(true);
    try {
      await api.post("/auth/signup", { name, email, password });

      await signIn(email, password);
    } catch (error) {
      console.log(error);

      const isAppError = error instanceof AppError;

      const title = isAppError
        ? error.message
        : "Não foi possivel cadastrar. Tente novamente mais tarde";

      Alert.alert("Erro", title);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Cadastro</Text>

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
              autoCapitalize="none"
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
          <Text style={styles.buttonText}>Cadastrar</Text>
        </Pressable>

        <View style={styles.row}>
          <Text>Já tem conta?</Text>
          <Link href="/sign-in" style={styles.link}>
            Entrar na conta
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
