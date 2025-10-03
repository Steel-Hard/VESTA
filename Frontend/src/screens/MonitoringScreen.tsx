import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonText } from '@/components/ui/button';
import { HeartIcon, UserIcon, BellIcon, WifiIcon, BatteryIcon } from '@/components/ui/icon';

export default function MonitoringScreen() {
  const [elderName, setElderName] = useState('Monise Souza');
  const [elderAge, setElderAge] = useState(85);
  const [heartRate, setHeartRate] = useState(70);
  const [isSafe, setIsSafe] = useState(true);
  const [deviceConnected, setDeviceConnected] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [lastUpdate, setLastUpdate] = useState('Há 2 minutos');

  // Função para simular alerta de frequência cardíaca
  const checkHeartRateAlert = (rate: number) => {
    if (rate > 100 || rate < 60) {
      setIsSafe(false);
      Alert.alert(
        'Alerta de Frequência Cardíaca',
        `Frequência cardíaca ${rate} BPM está fora do normal. Verifique o idoso.`,
        [{ text: 'OK', onPress: () => setIsSafe(true) }]
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Monitoramento
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Perfil do Idoso */}
        <View style={styles.profileCard}>
          <VStack space="lg" style={styles.profileContent}>
            {/* Foto do Idoso */}
            <View style={styles.photoContainer}>
              <View style={styles.photoCircle}>
                <UserIcon size={48} color="#4A5568" />
              </View>
              {/* Indicador de status */}
              <View style={[
                styles.statusIndicator,
                { backgroundColor: isSafe ? '#48BB78' : '#F56565' }
              ]}>
                <View style={styles.statusDot} />
              </View>
            </View>
            
            {/* Nome e Idade */}
            <VStack space="xs" style={styles.profileInfo}>
              <Text style={styles.elderName}>
                {elderName}
              </Text>
              <Text style={styles.elderAge}>
                {elderAge} Anos
              </Text>
              <Text style={styles.monitoringDate}>
                Monitorado desde 15/01/2024
              </Text>
            </VStack>
          </VStack>
        </View>

        {/* Status de Segurança */}
        <View style={styles.safetySection}>
          <TouchableOpacity
            style={[
              styles.safetyButton,
              { backgroundColor: isSafe ? '#48BB78' : '#F56565' }
            ]}
            onPress={() => {
              setIsSafe(!isSafe);
              if (!isSafe) {
                checkHeartRateAlert(heartRate);
              }
            }}
          >
            <View style={styles.safetyButtonContent}>
              <BellIcon size={24} color="white" />
              <Text style={styles.safetyButtonTitle}>
                {isSafe ? 'Em Segurança' : 'Alerta de Emergência!'}
              </Text>
            </View>
            <Text style={styles.safetyButtonSubtitle}>
              {isSafe 
                ? 'Todos os sinais vitais estão normais' 
                : 'Atenção necessária - Verifique o idoso'
              }
            </Text>
          </TouchableOpacity>
        </View>

        {/* Saúde Cardíaca */}
        <View style={styles.heartSection}>
          <Text style={styles.sectionTitle}>
            💓 Saúde Cardíaca
          </Text>
          
          <View style={styles.heartCard}>
            <View style={styles.heartContent}>
              {/* Ícone do Coração */}
              <View style={styles.heartIconContainer}>
                <View style={styles.heartIconCircle}>
                  <HeartIcon size={32} color="#F56565" />
                </View>
              </View>
              
              {/* Informações */}
              <View style={styles.heartInfo}>
                <View style={styles.heartRateContainer}>
                  <Text style={[
                    styles.heartRateText,
                    { color: heartRate > 100 || heartRate < 60 ? '#E53E3E' : '#48BB78' }
                  ]}>
                    {heartRate}
                  </Text>
                  <Text style={styles.bpmText}>BPM</Text>
                </View>
                <Text style={styles.heartRateLabel}>
                  Batimentos por Minuto
                </Text>
                <Text style={styles.lastUpdate}>
                  Última atualização: {lastUpdate}
                </Text>
              </View>
            </View>
            
            {/* Barra de progresso visual */}
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
                      backgroundColor: heartRate > 100 || heartRate < 60 ? '#F56565' : '#48BB78',
                      width: `${Math.min(Math.max((heartRate - 40) / 80 * 100, 0), 100)}%` 
                    }
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Status do Dispositivo */}
        <View style={styles.deviceSection}>
          <Text style={styles.sectionTitle}>
            📱 Status do Dispositivo
          </Text>
          
          <View style={styles.deviceCard}>
            <VStack space="md">
              {/* Conexão */}
              <View style={styles.deviceRow}>
                <View style={styles.deviceInfo}>
                  <WifiIcon 
                    size={24} 
                    color={deviceConnected ? '#48BB78' : '#F56565'}
                  />
                  <Text style={styles.deviceLabel}>
                    Conexão
                  </Text>
                </View>
                <Text style={[
                  styles.deviceStatus,
                  { color: deviceConnected ? '#38A169' : '#E53E3E' }
                ]}>
                  {deviceConnected ? 'Conectado' : 'Desconectado'}
                </Text>
              </View>
              
              {/* Bateria */}
              <View style={styles.deviceRow}>
                <View style={styles.deviceInfo}>
                  <BatteryIcon 
                    size={24} 
                    color={batteryLevel > 20 ? '#48BB78' : '#F56565'}
                  />
                  <Text style={styles.deviceLabel}>
                    Bateria
                  </Text>
                </View>
                <Text style={[
                  styles.deviceStatus,
                  { color: batteryLevel > 20 ? '#38A169' : '#E53E3E' }
                ]}>
                  {batteryLevel}%
                </Text>
              </View>
              
              {/* Última atualização */}
              <View style={styles.syncInfo}>
                <Text style={styles.syncText}>
                  Última sincronização: {lastUpdate}
                </Text>
              </View>
            </VStack>
          </View>
        </View>

        {/* Botão de Teste */}
        <View style={styles.testButtonContainer}>
          <Button 
            variant="outline" 
            action="primary" 
            size="lg"
            onPress={() => {
              const newHeartRate = Math.floor(Math.random() * 60) + 40;
              setHeartRate(newHeartRate);
              setLastUpdate('Agora');
              checkHeartRateAlert(newHeartRate);
            }}
          >
            <ButtonText>🔄 Simular Nova Leitura</ButtonText>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    backgroundColor: '#4A5568',
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  
  // Profile Styles
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileContent: {
    alignItems: 'center',
  },
  photoContainer: {
    position: 'relative',
  },
  photoCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#CBD5E0',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  profileInfo: {
    alignItems: 'center',
  },
  elderName: {
    color: '#1A202C',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  elderAge: {
    color: '#4A5568',
    fontSize: 18,
  },
  monitoringDate: {
    color: '#718096',
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Safety Styles
  safetySection: {
    marginBottom: 24,
  },
  safetyButton: {
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  safetyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  safetyButtonTitle: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20,
    marginLeft: 12,
  },
  safetyButtonSubtitle: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.9,
  },
  
  // Heart Section Styles
  heartSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#1A202C',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  heartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heartContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartIconContainer: {
    marginRight: 24,
  },
  heartIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FED7D7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartInfo: {
    flex: 1,
  },
  heartRateContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  heartRateText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  bpmText: {
    color: '#4A5568',
    fontSize: 18,
    marginLeft: 8,
  },
  heartRateLabel: {
    color: '#4A5568',
    fontSize: 14,
    marginTop: 4,
  },
  lastUpdate: {
    color: '#718096',
    fontSize: 12,
    marginTop: 8,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#718096',
    fontSize: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  
  // Device Section Styles
  deviceSection: {
    marginBottom: 24,
  },
  deviceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceLabel: {
    color: '#1A202C',
    fontWeight: '600',
    marginLeft: 12,
  },
  deviceStatus: {
    fontWeight: 'bold',
  },
  syncInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  syncText: {
    color: '#4A5568',
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Test Button Styles
  testButtonContainer: {
    marginBottom: 32,
  },
});
