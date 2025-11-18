import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configura o handler de notificações para quando o app está em foreground (opcional)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

/**
 * Solicita permissões, obtém o Expo Push Token e lida com erros.
 * @returns O Expo Push Token (string) ou null em caso de falha.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // 1. Verifica se é um dispositivo físico (simuladores não recebem tokens)
  if (!Device.isDevice) {
    console.warn('O token de push só pode ser obtido em um dispositivo físico.');
    return null;
  }

  // 2. Solicita/Verifica Permissões
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.error('Falha ao obter o status de permissão para push notification!');
      return null;
    }

    // 3. Obtém o Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    
    // O token é a propriedade 'data' do objeto retornado.
    const token = tokenData.data;

    console.log('Expo Push Token Obtido:', token);
    return token;

  } catch (error) {
    console.error('Erro ao obter o Expo Push Token:', error);
    return null;
  }
}