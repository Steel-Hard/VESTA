import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useLocalSearchParams, useRouter } from "expo-router";
import styles from "@/styles/monitoring.styles";
import DeviceService from "@/services/DeviceService";

export default function MonitoringScreen() {
  const params = useLocalSearchParams();
  const { name, birthDate, deviceId, imageUrl, _id } = params;
  const router = useRouter();

  const imageUri = Array.isArray(imageUrl) ? imageUrl[0] : imageUrl;
  const macAddress = Array.isArray(deviceId) ? deviceId[0] : deviceId;

  const [heartRate, setHeartRate] = useState(70);
  const [isSafe, setIsSafe] = useState(true);
  const [deviceConnected, setDeviceConnected] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [lastUpdate, setLastUpdate] = useState("Carregando...");
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  // Calcular idade a partir da data de nascimento
  const calculateAge = (birthDateStr: string | string[] | undefined): number => {
    if (!birthDateStr) return 0;
    const dateStr = Array.isArray(birthDateStr) ? birthDateStr[0] : birthDateStr;
    try {
      // Assumindo formato DD/MM/YYYY
      const [day, month, year] = dateStr.split('/');
      const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return 0;
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return "Agora";
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `Há ${minutes} minuto${minutes > 1 ? 's' : ''}`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `Há ${hours} hora${hours > 1 ? 's' : ''}`;
      } else {
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {
      return "Data inválida";
    }
  };

  const fetchLastMetric = async () => {
    if (!macAddress) {
      setIsLoading(false);
      return;
    }

    try {
      const lastMetric = await DeviceService.getLastMetric(macAddress);
      
      if (lastMetric) {
        // Calcular frequência cardíaca baseada nos valores do acelerômetro
        // Esta é uma aproximação - você pode ajustar a lógica conforme necessário
        const magnitude = Math.sqrt(
          lastMetric.x * lastMetric.x +
          lastMetric.y * lastMetric.y +
          lastMetric.z * lastMetric.z
        );
        
        // Simulação de frequência cardíaca baseada na magnitude
        // Ajuste esta lógica conforme sua necessidade
        const simulatedHeartRate = Math.floor(60 + (magnitude % 40));
        setHeartRate(simulatedHeartRate);
        
        // Verificar se houve queda
        if (lastMetric.fall) {
          setIsSafe(false);
        } else {
          setIsSafe(true);
        }
        
        setLastUpdate(formatTimeAgo(lastMetric.date));
        setDeviceConnected(true);
      } else {
        setDeviceConnected(false);
        setLastUpdate("Nenhum dado disponível");
      }
    } catch (error) {
      console.error("Erro ao buscar métrica:", error);
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

  const elderAge = calculateAge(birthDate);

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
              <Text style={styles.elderAge}>{elderAge} Anos</Text>
              <Text style={styles.monitoringDate}>
                Monitorado desde {new Date().toLocaleDateString('pt-BR')}
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
          </Pressable>
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
              const birthDateStr = Array.isArray(birthDate) ? birthDate[0] : birthDate;
              
              try {
                router.push({
                  pathname: "/elder/edit",
                  params: {
                    _id: elderId || '',
                    name: elderNameStr || '',
                    birthDate: birthDateStr || '',
                    deviceId: macAddress || '',
                    imageUrl: imageUri || '',
                  },
                });
              } catch (error) {
                console.error("Erro ao navegar:", error);
                Alert.alert("Erro", "Não foi possível abrir a tela de edição");
                setIsNavigating(false);
              }
            }}
          >
            <Text style={styles.outlineButtonText}>
              ✏️ Editar Idoso
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

