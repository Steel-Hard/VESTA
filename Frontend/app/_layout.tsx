import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "@/global.css";
import { useAuth } from "@/hooks/useAuth";
import { AuthContextProvider } from "@/context/AuthContext";
import { ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { store } from "@/store";

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const [isAuthenticated, setIsAutenticated] = useState(false);

  useEffect(() => {
    if (user && user.id) {
      setIsAutenticated(true);
    }
    if (!(user && user.id)) {
      setIsAutenticated(false);
    }
  }, [user]);

  if (isLoading) {
    return <ActivityIndicator />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthContextProvider>
        <RootLayoutNav />
        <StatusBar style="light" />
      </AuthContextProvider>
    </Provider>
  );
}
