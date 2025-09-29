import { Button, ScrollView, StyleSheet, Text, View } from "react-native";


export default function TabOneScreen() {

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <Text style={styles.title}>Welcome </Text>

      <View>
        <Text>User:</Text>
        <Text
          selectable
          style={{
            backgroundColor: "black",
            padding: 16,
            color: "orange",
            borderRadius: 16,
          }}
        >

        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
