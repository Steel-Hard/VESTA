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
  metric: Metric;
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

  public async getLastMetric(): Promise<Metric> {
    try {
      const { data } = await api.get<LastFallAlertResponse>(
        "/device/lastFallAlert"
      );

      return data.metric as Metric;
    } catch (error) {
      console.error("Erro ao buscar última métrica:", error);
      return {} as Metric;
    }
  }

  public async markAlertAsResolved(
    deviceId: string,
    alertId: string
  ): Promise<void> {
    try {
      const { data } = await api.put(
        `/device/resolveFallAlert/${deviceId}/${alertId}`
      );
      console.log(data);
    } catch (error) {
      console.error("Erro ao marcar alerta como resolvido:", error);
    }
  }
}

export default new DeviceService();
