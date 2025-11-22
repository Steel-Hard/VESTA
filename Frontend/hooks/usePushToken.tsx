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
          await Notifications.setNotificationChannelAsync("alert", {
          name: "alert",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          enableVibrate: true,
          sound: "alert.wav", 
          enableLights: true,
          lightColor: "#FF0000", 
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
          
        });
      }
    }

    register();
  }, []);

  return token;
}
