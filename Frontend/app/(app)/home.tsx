import { ScrollView, StyleSheet, Text, View } from "react-native";


export default function Home() {

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <Text style={styles.title}>Welcome </Text>

      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
