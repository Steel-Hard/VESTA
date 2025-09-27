import { Request, Response } from 'express';
import IElder from '../types/interfaces/IElder';
import userModel from '../models/user';
import mongoose from 'mongoose';
class ElderController {
  async addElder(_req: Request, _res: Response) {
    const { elderName, elderBirthDate, elderDeviceId } = _req.body;
    const { user } = _res.locals;

    const elderObject = {
      name: elderName,
      birthDate: new Date(elderBirthDate),
      deviceId: elderDeviceId,
    } as IElder;

    console.log(`Elder: ${elderObject}, userId: ${user}`);

    try {
      const newElderInUser = await userModel.findByIdAndUpdate(user, {
        $push: {
          eldely: elderObject,
        },
      });

      return _res.status(201).json(newElderInUser);
    } catch (error) {
      return _res.status(501).json({ error: 'Erro ao registrar idoso' });
    }
  }
  async findOneElderByUser(_req: Request, _res: Response) {
    const { elderId } = _req.params;
    const { user } = _res.locals;

    try {
      const userObject = await userModel.findById(user);

      const elder = userObject?.eldely.find((e) => e.id.toString() == elderId);

      return _res.status(200).json(elder);
    } catch {
      return _res.status(401).json({ error: 'Erro ao buscar idoso' });
    }
  }
  async findAllEldersByUser(_req: Request, _res: Response) {
    const { user } = _res.locals;

    console.log(`userId: ${user}`);

    try {
      const userObject = await userModel.findById(
        { _id: user },
        {
          _id: false,
          eldely: true,
        },
      );

      return _res.status(200).json(userObject);
    } catch {
      return _res.status(401).json({ error: 'Erro ao buscar idoso' });
    }
  }
  async deleteElderById(_req: Request, _res: Response) {
    const { elderId } = _req.params;
    const { user } = _res.locals;

    try {
      const deletedElder = await userModel.findByIdAndUpdate(
        user,
        {
          $pull: { eldely: { _id: elderId } },
        },
        { new: true },
      );

      return _res.status(200).json(deletedElder);
    } catch (error) {
      return _res.status(401).json({ error: 'Erro ao buscar idoso' });
    }
  }
  async updateElderById(_req: Request, _res: Response) {
    const { user } = _res.locals;
    const { elderId } = _req.params;
    const { newElderName, newElderBirthDate, newElderDeviceId } = _req.body;

    const updateElderObject = {
      name: newElderName,
      birthDate: new Date(newElderBirthDate),
      deviceId: newElderDeviceId,
    } as IElder;

    try {
      const updatedElder = await userModel.findByIdAndUpdate(
        user,

        {
          $set: { 'elderly.$[elem]': updateElderObject },
        },
        { new: true, arrayFilters: [{ 'elem._id': elderId }] },
      );

      return _res.status(200).json(updatedElder);
    } catch (error) {
      return _res.status(501).json({ error: 'Erro ao atualizar idoso' });
    }
  }
}

export default new ElderController();
