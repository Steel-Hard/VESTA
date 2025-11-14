import { Redirect } from "expo-router";

export default function AuthIndex() {
  // Redireciona para a tela de login por padrão
  return <Redirect href="/(auth)/sign-in" />;
}

