import { useAuth } from "@/hooks/useAuth";
import { styles } from "@/styles";
import { Pressable, ScrollView, Text } from "react-native";

export default function Profile() {
  const { user, signOut } = useAuth();
  return (
    <ScrollView>
      <Pressable
        onPress={signOut}
        style={styles.button}
      >
        <Text>Sair</Text>
      </Pressable>
    </ScrollView>
  );
}
