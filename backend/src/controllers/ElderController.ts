import { Request, Response } from 'express';
import IElder from '../types/interfaces/IElder';
import userModel from '../models/user';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';
import fs from 'fs';

class ElderController {
  async addElder(_req: Request, _res: Response) {
    const { elderName, elderBirthDate, elderDeviceId } = _req.body;
    const { user } = _res.locals;

    let imageUrl = undefined;

    try {
      if (_req.file) {
        const filePath = _req.file.path;

        cloudinary.config({
          cloud_name: config.CLOUDNARY_NAME,
          api_key: config.CLOUDNARY_API_KEY,
          api_secret: config.CLOUDNARY_API_SECRET,
        });

        const result = await cloudinary.uploader.upload(filePath, {
          folder: 'vesta/elders',
          transformation: [
            { width: 500, height: 500, crop: 'fill' },
            { quality: 'auto' },
          ],
        });

        fs.unlinkSync(filePath);
        imageUrl = result.secure_url;
      }

      const parsedDate = new Date(elderBirthDate);
      if (isNaN(parsedDate.getTime())) {
        return _res.status(400).json({ error: 'Data de nascimento inválida' });
      }

      const elderObject = {
        name: elderName,
        birthDate: parsedDate,
        deviceId: elderDeviceId,
        imageUrl: imageUrl,
      };

      try {
        const newElder = await userModel.findByIdAndUpdate(
          user,
          {
            $push: {
              eldely: elderObject,
            },
          },
          { new: true },
        );

        if (!newElder) {
          return _res.status(404).json({ error: 'Usuário não encontrado' });
        }

        return _res.status(201).json(newElder.eldely);
      } catch (error) {
        console.log(error);
        return _res.status(501).json({ error: 'Erro ao registrar idoso' });
      }
    } catch (error) {
      if (_req.file) {
        try {
          fs.unlinkSync(_req.file.path);
        } catch (e) {
          console.error('Error deleting temporary file:', e);
        }
      }
      console.log(error);
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
