import { Request, Response } from 'express';
import DeviceModel, { IMetric } from '../models/device';
import userModel from '../models/user';
import axios from 'axios';

class DeviceController {
  public async createDevice(req: Request, res: Response): Promise<Response> {
    try {
      const { macAddress, metric } = req.body;

      if (!macAddress) {
        return res.status(400).json({ error: 'macAddress é obrigatório' });
      }

      const device = await DeviceModel.create({
        macAddress,
        metric: metric || [],
      });
      return res.status(201).json(device);
    } catch (error) {
      console.error('Erro ao criar device:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  public async findDeviceById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const device = await DeviceModel.findById(id);

      if (!device) {
        return res.status(404).json({ error: 'Device não encontrado' });
      }

      return res.status(200).json(device);
    } catch (error) {
      console.error('Erro ao buscar device:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  public async updateDevice(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedDevice = await DeviceModel.findByIdAndUpdate(id, updates, {
        new: true,
      });

      if (!updatedDevice) {
        return res.status(404).json({ error: 'Device não encontrado' });
      }

      return res.status(200).json(updatedDevice);
    } catch (error) {
      console.error('Erro ao atualizar device:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  public async deleteDevice(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const deletedDevice = await DeviceModel.findByIdAndDelete(id);

      if (!deletedDevice) {
        return res.status(404).json({ error: 'Device não encontrado' });
      }

      return res.status(200).json({ message: 'Device removido com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar device:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  public async addNewMetric(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { x, y, z, fall } = req.body;

      if ([x, y, z, fall].some((v) => v === undefined)) {
        return res
          .status(400)
          .json({ error: 'Campos x, y, z e fall são obrigatórios' });
      }

      const newMetric: IMetric = {
        x,
        y,
        z,
        fall,
        date: new Date().toISOString(),
      };

      const updatedDevice = await DeviceModel.findByIdAndUpdate(
        id,
        { $push: { metric: newMetric } },
        { new: true },
      );

      if (!updatedDevice) {
        return res.status(404).json({ error: 'Device não encontrado' });
      }

      // Se detectou queda, enviar notificação push para usuários vinculados
      if (fall === true) {
        try {
          // use the class static method to avoid "this" being undefined when handlers are bound without context
          await DeviceController.sendFallNotification(
            updatedDevice.macAddress,
            newMetric,
          );
        } catch (notificationError) {
          console.error('Erro ao enviar notificação:', notificationError);
          // Não falha a requisição se a notificação falhar
        }
      }

      return res.status(200).json(updatedDevice);
    } catch (error) {
      console.error('Erro ao adicionar métrica:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  private static async sendFallNotification(
    macAddress: string,
    metric: IMetric,
  ): Promise<void> {
    try {
      // Buscar todos os usuários que têm idosos com este deviceId (macAddress)
      const users = await userModel.find({
        'eldely.deviceId': macAddress,
      });

      // Buscar o idoso específico para obter o nome
      let elderName = 'Idoso';
      for (const user of users) {
        const elder = user.eldely.find((e) => e.deviceId === macAddress);
        if (elder) {
          elderName = elder.name;
          break;
        }
      }

      // Enviar notificação para cada usuário que tem pushToken
      const notifications = [];

      for (const user of users) {
        if (user.pushToken) {
          notifications.push({
            to: user.pushToken,
            sound: 'default',
            title: '🚨 Alerta de Queda Detectada!',
            body: `Queda detectada para ${elderName} às ${new Date(metric.date).toLocaleTimeString('pt-BR')}`,
            data: {
              macAddress,
              metric,
              elderName,
            },
          });
        }
      }

      if (notifications.length > 0) {
        await axios.post(
          'https://exp.host/--/api/v2/push/send',
          notifications,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
        console.log(
          `Notificações enviadas para ${notifications.length} usuário(s)`,
        );
      }
    } catch (error) {
      console.error('Erro ao enviar notificação push:', error);
      throw error;
    }
  }
  public async getTodayMetricsByMacAddress(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const { macAddress } = req.params;

      if (!macAddress) {
        return res.status(400).json({ error: 'macAddress é obrigatório' });
      }

      const device = await DeviceModel.findOne({ macAddress });

      if (!device) {
        return res.status(404).json({ error: 'Dispositivo não encontrado' });
      }

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const todayMetrics = device.metric.filter((m) =>
        m.date.startsWith(todayStr),
      );

      return res.status(200).json({
        macAddress: device.macAddress,
        totalMetrics: todayMetrics.length,
        metrics: todayMetrics,
      });
    } catch (error) {
      console.error('Erro ao buscar métricas do dia:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  public async getLastFallAlertByUser(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const { user } = res.locals;

      // Buscar usuário e seus idosos
      const userData = await userModel.findById(user);

      if (!userData || !userData.eldely || userData.eldely.length === 0) {
        return res.status(200).json({
          hasAlert: false,
          message: 'Nenhum idoso cadastrado',
        });
      }

      // Obter todos os deviceIds dos idosos do usuário
      const deviceIds = userData.eldely.map((elder) => elder.deviceId);

      // Buscar todos os dispositivos vinculados
      const devices = await DeviceModel.find({
        macAddress: { $in: deviceIds },
      });

      if (!devices || devices.length === 0) {
        return res.status(200).json({
          hasAlert: false,
          message: 'Nenhum dispositivo encontrado',
        });
      }

      // Buscar a última métrica com fall=true de todos os dispositivos
      let lastFallMetric: IMetric | null = null;
      let lastFallDevice: any = null;
      let elderName = '';

      for (const device of devices) {
        // Filtrar métricas com fall=true e ordenar por data (mais recente primeiro)
        const fallMetrics = device.metric
          .filter((m) => m.fall === true)
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );

        if (fallMetrics.length > 0) {
          const mostRecentFall = fallMetrics[0];
          if (
            !lastFallMetric ||
            new Date(mostRecentFall.date).getTime() >
              new Date(lastFallMetric.date).getTime()
          ) {
            lastFallMetric = mostRecentFall;
            lastFallDevice = device;
          }
        }
      }

      if (!lastFallMetric || !lastFallDevice) {
        return res.status(200).json({
          hasAlert: false,
          message: 'Nenhum alerta de queda encontrado',
        });
      }

      const elder = userData.eldely.find(
        (e) => e.deviceId === lastFallDevice.macAddress,
      );
      if (elder) {
        elderName = elder.name;
      }

      return res.status(200).json({
        hasAlert: true,
        metric: lastFallMetric,
        macAddress: lastFallDevice.macAddress,
        elderName,
        deviceId: lastFallDevice._id,
      });
    } catch (error) {
      console.error('Erro ao buscar último alerta:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

export default new DeviceController();
