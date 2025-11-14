import { Redirect } from "expo-router";

export default function AppIndex() {
  // Redireciona para a primeira aba (elder/list)
  return <Redirect href="/(app)/elder/list" />;
}

