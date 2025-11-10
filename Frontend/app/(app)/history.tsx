import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import styles from "@/styles/history.styles";
export default function FallAlert() {
  return (
    <View style={styles.container}>
      {/* Conteúdo principal */}
      <View style={styles.content}>
        <Text style={styles.title}>Alerta de Quedas</Text>

        <Text style={styles.subtitle}>Queda Detectada</Text>

        <View style={styles.card}>
          <Ionicons name="time-outline" size={50} color="#000" />
          <Text style={styles.cardText}>Hora da Queda</Text>
          <Text style={styles.cardHour}>18:30</Text>
        </View>

        <TouchableOpacity style={[styles.button, styles.buttonRed]}>
          <Text style={styles.buttonText}>Ligar para o Idoso</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.buttonRed]}>
          <Text style={styles.buttonText}>Notificar Contatos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.buttonGreen]}>
          <Text style={styles.buttonText}>Marcar como Resolvido</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
