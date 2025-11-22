import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Alert, Image } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useLocalSearchParams, useRouter } from "expo-router";
import styles from "@/styles/monitoring.styles";
import DeviceService from "@/services/DeviceService";
import { calculateAge } from "@/utils/calculateAge";
import { formatTimeAgo } from "@/utils/formatTimeAgo";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { AppError } from "@/utils/AppError";

export default function MonitoringScreen() {
  const params = useLocalSearchParams();
  const { name, birthDate, deviceId, imageUrl, _id } = params;
  const router = useRouter();

  const imageUri = Array.isArray(imageUrl) ? imageUrl[0] : imageUrl;
  const macAddress = Array.isArray(deviceId) ? deviceId[0] : deviceId;

  const [isSafe, setIsSafe] = useState(true);
  const [deviceConnected, setDeviceConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("Carregando...");
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  const fetchLastMetric = async () => {
    if (!macAddress) {
      setIsLoading(false);
      return;
    }

    try {
      const lastMetric = await DeviceService.getLastMetric();


      if (lastMetric && lastMetric.macAddress === macAddress) {
        setIsSafe(lastMetric.metric.isResolved);
        setLastUpdate(formatTimeAgo(new Date(lastMetric.metric.date).toString()));
        setDeviceConnected(true);
      } else {
        setDeviceConnected(false);
        setLastUpdate("Nenhum dado disponível");
      }
    } catch (error: any) {
      const isAppError = error instanceof AppError;
      const title = isAppError
        ? error.message
        : "Erro ao buscar última métrica. Tente novamente mais tarde";
      Alert.alert("Erro", title);
      setDeviceConnected(false);
      setLastUpdate("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLastMetric();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchLastMetric, 30000);

    return () => clearInterval(interval);
  }, [macAddress]);


  return (
    <ScrollView style={styles.container}>
      {/* Content */}
      <View style={styles.content}>
        {/* Perfil */}
        <View style={styles.profileCard}>
          <View style={styles.profileContent}>
            <View style={styles.photoContainer}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.photoCircle} />
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
              <Text style={styles.elderAge}>
                {calculateAge(birthDate)} anos
              </Text>
            </View>
          </View>
        </View>

        {/* Segurança */}
        <View style={styles.safetySection}>
          <Pressable
            style={[
              styles.safetyButton,
              { backgroundColor: isSafe ? "#48BB78" : "#F56565" },
            ]}
          >
            <View style={styles.safetyButtonContent}>
              <Icon
                name={isSafe ? "check-circle" : "alert-circle"}
                size={24}
                color="white"
              />
              <Text style={styles.safetyButtonTitle}>
                {isSafe ? "Em Segurança" : "Queda Detectada!"}
              </Text>
            </View>
            <Text style={styles.safetyButtonSubtitle}>
              {isSafe
                ? "Sem detecção de queda"
                : "Queda foi detectada - Verificação necessária"}
            </Text>
          </Pressable>
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
                {deviceConnected ? "Sincronizado" : "Desincronizado"}
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

        {/* Botão de Edição */}
        <View style={styles.testButtonContainer}>
          <Pressable
            style={styles.outlineButton}
            disabled={isNavigating}
            onPress={() => {
              if (isNavigating) return;

              setIsNavigating(true);
              const elderId = Array.isArray(_id) ? _id[0] : _id;
              const elderNameStr = Array.isArray(name) ? name[0] : name;
              const birthDateStr = Array.isArray(birthDate)
                ? birthDate[0]
                : birthDate;

              try {
                router.push({
                  pathname: "/elder/edit",
                  params: {
                    _id: elderId || "",
                    name: elderNameStr || "",
                    birthDate: birthDateStr || "",
                    deviceId: macAddress || "",
                    imageUrl: imageUri || "",
                  },
                });
              } catch (error) {
                console.error("Erro ao navegar:", error);
                Alert.alert("Erro", "Não foi possível abrir a tela de edição");
                setIsNavigating(false);
              }
            }}
          >
            <Text style={styles.outlineButtonText}>Editar Idoso </Text>
            <MaterialCommunityIcons name="pencil" size={26} />
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
