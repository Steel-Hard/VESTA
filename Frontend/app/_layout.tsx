import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "@/global.css";
import { AuthContextProvider } from "@/context/AuthContext";
import { Provider } from "react-redux";
import { store } from "@/store";

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
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
