import { AppError } from "@/utils/AppError";
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
    try {
      const { data } = await api.get<LastFallAlertResponse>(
        `/device/lastFallAlert`
      );
      return data;
    } catch (error: any) {
      throw new AppError(
        error?.response?.data?.message || "Erro ao buscar última métrica."
      );
    }
  }

  public async getLastMetric(): Promise<Metric> {
    try {
      const { data } = await api.get<LastFallAlertResponse>(
        "/device/lastFallAlert"
      );

      return data.metric as Metric;
    } catch (error: any) {
      throw new AppError(
        error?.response?.data?.message || "Erro ao buscar última métrica."
      );
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
    } catch (error: any) {
      throw new AppError(
        error?.response?.data?.message || "Erro ao marcar com resolvido."
      );
    }
  }
}

export default new DeviceService();
