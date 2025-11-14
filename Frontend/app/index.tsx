import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // Se o usuário estiver autenticado, redireciona para a área do app
  if (user && user.id) {
    return <Redirect href="/(app)/elder/list" />;
  }

  // Se não estiver autenticado, redireciona para a tela de login
  return <Redirect href="/(auth)/sign-in" />;
}

