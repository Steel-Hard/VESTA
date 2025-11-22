import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, Linking, ScrollView, Alert } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import styles from "@/styles/history.styles";
import DeviceService, { LastFallAlertResponse } from "@/services/DeviceService";

export default function FallAlert() {
  const [alertData, setAlertData] = useState<LastFallAlertResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    fetchLastAlert();
  }, []);

  const fetchLastAlert = async () => {
    try {
      setIsLoading(true);
      const data = await DeviceService.getLastFallAlert();
      setAlertData(data);
    } catch (error) {
      console.error("Erro ao buscar último alerta:", error);
    } finally {
      setIsLoading(false);
      setIsResolving(false);
    }
  };

  const formatDateTime = (dateString: string): { date: string; time: string } => {
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        time: date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    } catch {
      return { date: "Data inválida", time: "Hora inválida" };
    }
  };

  const handleCall = () => {
    Linking.openURL('tel:');
  };

  const handleMarkResolved = async () => {
    if (!alertData) return;
    // se já estiver resolvido, não tenta resolver novamente
    if (alertData.metric?.isResolved) {
      Alert.alert("Aviso", "Alerta já está marcado como resolvido.");
      return;
    }

    if (!alertData.deviceId) {
      console.error("Device ID ausente para resolver alerta");
      Alert.alert("Erro", "Não foi possível identificar o dispositivo para resolver o alerta.");
      return;
    }

    // usar alguma identificação do alerta; se não houver id claro, tentar usar a date como fallback
    const alertId = alertData.metric?.date;
    if (!alertId) {
      console.error("Alert ID ausente para resolver alerta");
      Alert.alert("Erro", "Não foi possível identificar o alerta para resolver.");
      return;
    }

    try {
      setIsResolving(true);
      await DeviceService.markAlertAsResolved(alertData.deviceId, alertData.metric?._id);
      Alert.alert("Sucesso", "Alerta marcado como resolvido.");
      await fetchLastAlert(); 
    } catch (error) {
      console.error("Erro ao marcar alerta como resolvido:", error);
      Alert.alert("Erro", "Falha ao marcar alerta como resolvido.");
      setIsResolving(false);
    }
  };

  if (isLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: "#F7FAFC" }} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#7E57C2" />
          <Text style={styles.subtitle}>Carregando alertas...</Text>
        </View>
      </ScrollView>
    );
  }

  // Corrigida a condição: mostra "nenhum alerta" se não houver alertData ou hasAlert === false ou metric ausente
  if (!alertData || !alertData.hasAlert || !alertData.metric) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: "#F7FAFC" }} contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
        <View style={styles.content}>
          <Text style={styles.title}>Alerta de Quedas</Text>
          <Text style={styles.subtitle}>
            {alertData?.message || "Nenhum alerta de queda encontrado"}
          </Text>
          <Pressable
            style={[styles.button, { backgroundColor: "#7E57C2", marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "center" }]}
            onPress={fetchLastAlert}
          >
             <Ionicons name="reload" size={20} color="#fff" />
            <Text style={styles.buttonText}>Atualizar</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const { date, time } = formatDateTime(alertData.metric.date);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F7FAFC" }} contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}>
      {/* Conteúdo principal */}
      <View>
        <Text style={styles.title}>Alerta de Quedas</Text>

        <Text style={styles.subtitle}>
          Queda Detectada{alertData.elderName ? ` - ${alertData.elderName}` : ''}
        </Text>

        <View style={styles.card}>
          <Ionicons name="time-outline" size={50} color="#000" />
          <Text style={styles.cardText}>Data da Queda</Text>
          <Text style={styles.cardHour}>{date}</Text>
          <Text style={styles.cardText}>Hora da Queda</Text>
          <Text style={styles.cardHour}>{time}</Text>
        </View>

        {alertData.metric && (
          <View style={styles.card}>
            <Ionicons name="pulse-outline" size={50} color="#000" />
            <Text style={styles.cardText}>Dados do Acelerômetro</Text>
            <Text style={styles.cardHour}>
              X: {alertData.metric.x.toFixed(2)} | Y: {alertData.metric.y.toFixed(2)} | Z: {alertData.metric.z.toFixed(2)}
            </Text>
            {/* Indica se está resolvido */}
            <Text style={[styles.cardText, { marginTop: 8 }]}>
              Status: {alertData.metric.isResolved ? "Resolvido" : "Pendente"}
            </Text>
          </View>
        )}

        <Pressable
          style={[styles.button, styles.buttonRed]}
          onPress={handleCall}
        >
          <Text style={styles.buttonText}>Ligar para Emergência</Text>
        </Pressable>

    
        <Pressable
          style={[styles.button, styles.buttonGreen, alertData.metric?.isResolved || isResolving ? { opacity: 0.6 } : {}]}
          onPress={handleMarkResolved}
          disabled={alertData.metric?.isResolved || isResolving}
        >
          <Text style={styles.buttonText}>{isResolving ? "Marcando..." : (alertData.metric?.isResolved ? "Resolvido" : "Marcar como Resolvido")}</Text>
        </Pressable>

        <Pressable
          style={[styles.button, { backgroundColor: "#7E57C2", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }]}
          onPress={fetchLastAlert}
        >
          <Text style={styles.buttonText}> Atualizar</Text>
          <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
        </Pressable>
      </View>
    </ScrollView>
  );
}
