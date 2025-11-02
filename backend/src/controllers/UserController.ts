import { Request, Response, NextFunction } from 'express';
import userModel from '../models/user';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { jwtSecret } from '../middlewares/jwt';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import * as fsExtra from 'fs-extra';

class UserController {
  //TODO: VERIFICAR OS TRATAMENDO DE ERROS
  public async createUser(req: Request, res: Response) {
    const { name, email, password } = req.body;
    const nPassword = await bcrypt.hash(password, 8);

    try {
      const data = await userModel.insertOne({
        name,
        email,
        password: nPassword,
        authProvider: 'local',
      });
      res.status(201).json({ data });
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json(error);
      }

      console.log(error);
      throw new Error('Erro ao criar usuário');
    }
  }
  public async readUser(req: Request, res: Response): Promise<any> {
    const { email, password } = req.body;
    try {
      const data = await userModel.findOne({ email: email });

      if (!data || !data.password)
        return res.status(404).send('Usuário não encontrado');

      await bcrypt
        .compare(password, data.password)
        .then((status) => {
          if (status == false)
            return res.status(500).send('Erro senha incorreta');

          const token = jwt.sign(data.id, jwtSecret, {});

          return res.status(200).json({
            message: 'Sucesso no Login',
            token: token,
            user: {
              id: data.id,
              authProvider: data.authProvider,
              name: data.name,
              email: data.email,
              elderly: data.eldely,
              avatar: data.avatar,
            },
          });
        })
        .catch((error) => {
          console.log(error);
          return res.status(401).send('Invalid password');
        });
    } catch (error) {
      console.log(error);
      throw new Error('Erro ao buscar usuário');
    }
  }
  public async AuthWithGoogle(req: Request, res: Response): Promise<any> {
    const { idToken } = req.params;

    const client = new OAuth2Client(config.CLIENT_ID);

    try {
      const tiket = await client.verifyIdToken({
        idToken,
        audience: config.CLIENT_ID,
      });

      const payload = tiket.getPayload();

      let user = await userModel.findOne({ googleId: payload?.sub });

      if (!user && payload) {
        user = await userModel.findOne({ email: payload.email });

        if (user) {
          user.googleId = payload.sub;
          user.authProvider = 'google';
          await user.save();
        } else {
          user = await userModel.create({
            email: payload.email,
            name: payload.name,
            avatar: payload.picture,
            googleId: payload.sub,
            authProvider: 'google',
          });
        }
      }

      return res.status(200).json(payload);
    } catch (error) {
      res.status(401).json({ error: 'Token inválido' });
    }
  }

  public async updatePassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { email, currentPassword, newPassword } = req.body;
    try {
      const user = await userModel.findOne({ email: email });
      if (!user) {
        res.status(404).send('Usuário não encontrado');
        return;
      }
      const isPasswordValid = user.password
        ? await bcrypt.compare(currentPassword, user.password)
        : false;
      if (!isPasswordValid) {
        res.status(400).send('Senha atual incorreta');
        return;
      }
      const hashedNewPassword = await bcrypt.hash(newPassword, 8);
      await userModel.updateOne(
        { email: email },
        { $set: { password: hashedNewPassword } },
      );
      res.status(200).json({ message: 'Senha atualizada com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  public async updateAvatar(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { user } = res.locals;

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    try {
      const filePath = req.file.path;
      cloudinary.config({
        cloud_name: config.CLOUDNARY_NAME,
        api_key: config.CLOUDNARY_API_KEY,
        api_secret: config.CLOUDNARY_API_SECRET,
      });

      // Buscar usuário atual
      const currentUser = await userModel.findById(user);

      // Se existe avatar anterior, tenta deletar
      if (currentUser?.avatar) {
        try {
          const oldPublicId = currentUser.avatar
            .split('/')
            .slice(-1)[0]
            .split('.')[0];
          if (oldPublicId) {
            await cloudinary.uploader.destroy(`vesta/${oldPublicId}`);
          }
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }

      // Upload da nova imagem
      const publicId = `user_${user}_${Date.now()}`;
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'vesta',
        public_id: publicId,
        overwrite: true,
        transformation: [
          { width: 500, height: 500, crop: 'fill' },
          { quality: 'auto' },
        ],
      });

      // Remover arquivo temporário
      fs.unlinkSync(filePath);

      await userModel.updateOne(
        { _id: user },
        { $set: { avatar: result.secure_url } },
      );

      res.status(200).json({
        message: 'Avatar atualizado com sucesso',
        url: result.secure_url,
      });
    } catch (error) {
      console.error('Error updating avatar:', error);
      res.status(500).json({ error: 'Erro ao atualizar avatar' });
    }
  }
}

export default new UserController();
