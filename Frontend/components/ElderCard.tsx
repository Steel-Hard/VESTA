import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/styles";

type ElderCardProps = {
  nome: string;
  onPress?: () => void;
}

export function ElderCard({ nome, onPress }: ElderCardProps) {
  return (
    <Pressable style={styles.elderCard} onPress={onPress}>
      <View style={styles.elderIconContainer}>
        <Ionicons name="person" size={32} color="#7E57C2" />
      </View>
      <Text style={styles.elderName} numberOfLines={1}>{nome}</Text>
    </Pressable>
  );
}
