import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  alertIcon: {
    width: 90,
    height: 90,
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  cardText: {
    fontSize: 16,
    marginTop: 10,
    fontWeight: "bold",
  },
  cardHour: {
    fontSize: 20,
    marginTop: 5,
    fontWeight: "bold",
  },
  button: {
    width: "100%",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 5,
  },
  buttonRed: {
    backgroundColor: "#B71C1C",
  },
  buttonGreen: {
    backgroundColor: "#2E7D32",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomMenu: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  notificationWrapper: {
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    right: -8,
    top: -5,
    backgroundColor: "red",
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});