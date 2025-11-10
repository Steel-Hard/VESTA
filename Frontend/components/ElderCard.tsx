import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/styles";
type ElderCardProps = {
  name: string;
  imageUrl?: string;
  onPress?: () => void;
};

export function ElderCard({ name, imageUrl, onPress }: ElderCardProps) {
  const AVATAR_SIZE = 60; 
  return (
    <Pressable style={styles.elderCard} onPress={onPress}>
      <View style={{ marginRight: 12 }}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: 50,
            }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              backgroundColor: "#f0f0f0",
              borderRadius: 50,
              alignItems: "center",
              justifyContent: "center",
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
            }}
          >
            <Ionicons name="person" size={AVATAR_SIZE- 20} color="#7E57C2" />
          </View>
        )}
      </View>
      <Text style={styles.elderName} numberOfLines={1}>
        {name}
      </Text>
    </Pressable>
  );
}
