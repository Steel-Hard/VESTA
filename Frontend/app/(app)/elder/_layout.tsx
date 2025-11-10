import { Stack } from "expo-router";

export default function ElderLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="list"
        options={{
          title: "Lista de Idosos",
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: "Cadastro Idoso",
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="monitoring"
        options={{
          title: "Monitoramento de Idoso",
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="comorbity"
        options={{
          title: "Cadastrar comorbidade",
          headerTitleAlign: "center",
        }}
      />
    </Stack>
  );
}
