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

  const [isSafe, setIsSafe] = useState(true);
  const [deviceConnected, setDeviceConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("Carregando...");
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  /**
   * Calcula a idade a partir de uma data de nascimento em formato DD/MM/YYYY ou ISO (YYYY-MM-DD)
   * @param birthDateStr - Data de nascimento em formato DD/MM/YYYY ou ISO (YYYY-MM-DDTHH:MM:SS.SSSZ)
   * @returns A idade em anos
   */
  const calculateAge = (birthDateStr: string | string[] | undefined): number => {
    if (!birthDateStr) return 0;
    
    const dateStr = Array.isArray(birthDateStr) ? birthDateStr[0] : birthDateStr;
    
    try {
      let birthDate: Date;

      // Detectar se é formato ISO (YYYY-MM-DDTHH:MM:SS.SSSZ ou YYYY-MM-DD)
      if (dateStr.includes('T') || dateStr.includes('-')) {
        // Formato ISO: 1998-03-03T03:00:00.000Z
        birthDate = new Date(dateStr);
        if (isNaN(birthDate.getTime())) {
          console.error('Data ISO inválida:', dateStr);
          return 0;
        }
      } else if (dateStr.includes('/')) {
        // Formato DD/MM/YYYY
        const parts = dateStr.trim().split('/');
        if (parts.length !== 3) {
          console.error('Formato de data inválido. Use DD/MM/YYYY:', dateStr);
          return 0;
        }

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        if (isNaN(day) || isNaN(month) || isNaN(year)) {
          console.error('Data contém valores inválidos:', dateStr);
          return 0;
        }

        birthDate = new Date(year, month - 1, day);
      } else {
        console.error('Formato de data não reconhecido:', dateStr);
        return 0;
      }

      const today = new Date();

      // Calcular diferença de anos
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();

      // Ajustar se ainda não completou aniversário neste ano
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
      }

      return Math.max(0, age);
    } catch (error) {
      console.error('Erro ao calcular idade:', error);
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
        // Atualizar status de segurança baseado na detecção de queda
        setIsSafe(!lastMetric.fall);
        
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
              <Text style={styles.elderAge}>{calculateAge(birthDate)} anos</Text>
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
          >
            <View style={styles.safetyButtonContent}>
              <Icon name={isSafe ? "check-circle" : "alert-circle"} size={24} color="white" />
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

