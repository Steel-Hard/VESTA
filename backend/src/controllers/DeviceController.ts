import { Request, Response } from 'express';
import DeviceModel, { IMetric } from '../models/device';

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

      return res.status(200).json(updatedDevice);
    } catch (error) {
      console.error('Erro ao adicionar métrica:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
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
}

export default new DeviceController();
