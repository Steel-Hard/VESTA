import { api } from "./api";

export interface Metric {
  _id: string; 
  x: number;
  y: number;
  z: number;
  fall: boolean;
  date: string;
  isResolved: boolean;
  resolvedAt: string;
  resolvedBy: string;
}

export interface DeviceMetricsResponse {
  macAddress: string;
  totalMetrics: number;
  metrics: Metric[];
}

export interface LastFallAlertResponse {
  hasAlert: boolean;
  message?: string;
  metric?: Metric;
  macAddress?: string;
  elderName?: string;
  deviceId?: string;
}

class DeviceService {
  public async getTodayMetricsByMacAddress(
    macAddress: string
  ): Promise<DeviceMetricsResponse> {
    const { data } = await api.get<DeviceMetricsResponse>(
      `/device/metric/${macAddress}`
    );
    return data;
  }

  public async getLastFallAlert(): Promise<LastFallAlertResponse> {
    const { data } = await api.get<LastFallAlertResponse>(
      `/device/lastFallAlert`
    );
    return data;
  }

  public async getLastMetric(macAddress: string): Promise<Metric | null> {
    try {
      const response = await this.getTodayMetricsByMacAddress(macAddress);
      if (response.metrics && response.metrics.length > 0) {
        // Ordenar por data (mais recente primeiro) e retornar a última
        const sortedMetrics = response.metrics.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        return sortedMetrics[0];
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar última métrica:", error);
      return null;
    }
  }

  public async markAlertAsResolved(
    deviceId: string,
    alertId: string
  ): Promise<void> {
    try {
      await api.post(`/device/resolveFallAlert/${deviceId}/${alertId}`);
    } catch (error) {
      console.error("Erro ao marcar alerta como resolvido:", error);
      return Promise.reject(error);
    }
  }
}

export default new DeviceService();
