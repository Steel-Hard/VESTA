import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#7E57C2",
      }}
    >
      <Tabs.Screen
        name="elder"
        options={{
          tabBarIcon: ({ color }) => {
            return <Ionicons name="desktop-outline" size={28} color={color} />;
          },
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({color}) => {
            return <Ionicons name="time-outline" size={28} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({color}) => {
            return <Ionicons name="person-outline" size={28} color={color} />;
          },
        }}
      />
    </Tabs>
  );
}
