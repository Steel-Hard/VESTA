import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

export function usePushToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    async function register() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("Permissão negada");
        return;
      }

      const expoToken = (await Notifications.getExpoPushTokenAsync()).data;
      
      setToken(expoToken);

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX
        });
      }
    }

    register();
  }, []);
  
  console.log("Push Token:", token);
  
  return token;
}