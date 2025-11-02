import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useLocalSearchParams } from "expo-router";
import styles from "@/styles/monitoring.styles"

export default function MonitoringScreen() {
  const { name, birthDate, deviceId, imageUrl } = useLocalSearchParams();

  const imageUri = Array.isArray(imageUrl) ? imageUrl[0] : imageUrl;

  console.log(`destino result:  ${name}`);
  const [heartRate, setHeartRate] = useState(70);
  const [isSafe, setIsSafe] = useState(true);
  const [deviceConnected, setDeviceConnected] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [lastUpdate, setLastUpdate] = useState("Há 2 minutos");

  const checkHeartRateAlert = (rate: number) => {
    if (rate > 100 || rate < 60) {
      setIsSafe(false);
      Alert.alert(
        "Alerta de Frequência Cardíaca",
        `Frequência cardíaca ${rate} BPM está fora do normal. Verifique o idoso.`,
        [{ text: "OK", onPress: () => setIsSafe(true) }]
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Content */}
      <View style={styles.content}>
        {/* Perfil */}
        <View style={styles.profileCard}>
          <View style={styles.profileContent}>
            <View style={styles.photoContainer}>
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.photoCircle}
                />
              ) : (
                <View style={styles.photoCircle}>
                  <Icon name="user" size={48} color="#4A5568" />
                </View>
              )}
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: isSafe ? "#48BB78" : "#F56565" },
                ]}
              >
                <View style={styles.statusDot} />
              </View>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.elderName}>{name}</Text>
              <Text style={styles.elderAge}>{80} Anos</Text>
              <Text style={styles.monitoringDate}>
                Monitorado desde 15/01/2024
              </Text>
            </View>
          </View>
        </View>

        {/* Segurança */}
        <View style={styles.safetySection}>
          <TouchableOpacity
            style={[
              styles.safetyButton,
              { backgroundColor: isSafe ? "#48BB78" : "#F56565" },
            ]}
            onPress={() => {
              setIsSafe(!isSafe);
              if (!isSafe) checkHeartRateAlert(heartRate);
            }}
          >
            <View style={styles.safetyButtonContent}>
              <Icon name="bell" size={24} color="white" />
              <Text style={styles.safetyButtonTitle}>
                {isSafe ? "Em Segurança" : "Alerta de Emergência!"}
              </Text>
            </View>
            <Text style={styles.safetyButtonSubtitle}>
              {isSafe
                ? "Todos os sinais vitais estão normais"
                : "Atenção necessária - Verifique o idoso"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Saúde Cardíaca */}
        <View style={styles.heartSection}>
          <Text style={styles.sectionTitle}>💓 Saúde Cardíaca</Text>

          <View style={styles.heartCard}>
            <View style={styles.heartContent}>
              <View style={styles.heartIconContainer}>
                <View style={styles.heartIconCircle}>
                  <Icon name="heart" size={32} color="#F56565" />
                </View>
              </View>

              <View style={styles.heartInfo}>
                <View style={styles.heartRateContainer}>
                  <Text
                    style={[
                      styles.heartRateText,
                      {
                        color:
                          heartRate > 100 || heartRate < 60
                            ? "#E53E3E"
                            : "#48BB78",
                      },
                    ]}
                  >
                    {heartRate}
                  </Text>
                  <Text style={styles.bpmText}>BPM</Text>
                </View>
                <Text style={styles.heartRateLabel}>Batimentos por Minuto</Text>
                <Text style={styles.lastUpdate}>
                  Última atualização: {lastUpdate}
                </Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>Normal</Text>
                <Text style={styles.progressLabel}>Alto</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor:
                        heartRate > 100 || heartRate < 60
                          ? "#F56565"
                          : "#48BB78",
                      width: `${Math.min(
                        Math.max(((heartRate - 40) / 80) * 100, 0),
                        100
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Status do Dispositivo */}
        <View style={styles.deviceSection}>
          <Text style={styles.sectionTitle}>📱 Status do Dispositivo</Text>

          <View style={styles.deviceCard}>
            {/* Conexão */}
            <View style={styles.deviceRow}>
              <View style={styles.deviceInfo}>
                <Icon
                  name="wifi"
                  size={24}
                  color={deviceConnected ? "#48BB78" : "#F56565"}
                />
                <Text style={styles.deviceLabel}>Conexão</Text>
              </View>
              <Text
                style={[
                  styles.deviceStatus,
                  { color: deviceConnected ? "#38A169" : "#E53E3E" },
                ]}
              >
                {deviceConnected ? "Conectado" : "Desconectado"}
              </Text>
            </View>

            {/* Bateria */}
            <View style={styles.deviceRow}>
              <View style={styles.deviceInfo}>
                <Icon
                  name="battery"
                  size={24}
                  color={batteryLevel > 20 ? "#48BB78" : "#F56565"}
                />
                <Text style={styles.deviceLabel}>Bateria</Text>
              </View>
              <Text
                style={[
                  styles.deviceStatus,
                  { color: batteryLevel > 20 ? "#38A169" : "#E53E3E" },
                ]}
              >
                {batteryLevel}%
              </Text>
            </View>

            {/* Última atualização */}
            <View style={styles.syncInfo}>
              <Text style={styles.syncText}>
                Última sincronização: {lastUpdate}
              </Text>
            </View>
          </View>
        </View>

        {/* Botão de Teste */}
        <View style={styles.testButtonContainer}>
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => {
              const newHeartRate = Math.floor(Math.random() * 60) + 40;
              setHeartRate(newHeartRate);
              setLastUpdate("Agora");
              checkHeartRateAlert(newHeartRate);
            }}
          >
            <Text style={styles.outlineButtonText}>
              🔄 Simular Nova Leitura
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

