import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: false }}>
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: () => {
            return (
              <MaterialIcons name="desktop-windows" size={24} color="black" />
            );
          },
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: () => {
            return (
               <Ionicons name="time-outline" size={28} color="black" />
            );
          },
        }}
      />
        <Tabs.Screen
          name="elder"
          options={{
            tabBarIcon: () => {
              return (
                <Ionicons name="settings-outline" size={28} color="black" />
              );
            },
          }}
        />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: () => {
            return (
                <Ionicons name="person-outline" size={28} color="black" />
            );
          },
        }}
      />
    </Tabs>
  );
}
