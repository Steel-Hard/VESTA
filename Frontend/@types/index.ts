// Tipos para o usuário cuidador/familiar
export interface UserDTO {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}


export interface IAuthData{
  user: UserDTO;
  token: string;
  refresh_token: string;
}

// Tipos para o idoso monitorado
export interface Elderly {
  _id: string;
  name: string;
  age: number;
  medicalConditions?: string[];
  emergencyContacts: EmergencyContact[];
  deviceId: string;
  isConnected: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para contatos de emergência
export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

// Tipos para alertas/eventos
export interface Alert {
  id: string;
  elderlyId: string;
  type: 'fall' | 'battery_low' | 'disconnected' | 'manual';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  isRead: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
}

// Tipos para histórico
export interface HistoryEvent {
  id: string;
  elderlyId: string;
  type: 'fall' | 'battery' | 'connection' | 'manual_alert';
  timestamp: Date;
  details: string;
  resolved: boolean;
}

// Tipos para configurações do dispositivo
export interface DeviceSettings {
  id: string;
  elderlyId: string;
  fallSensitivity: 'low' | 'medium' | 'high';
  batteryAlertThreshold: number;
  connectionTimeout: number;
  isActive: boolean;
}
