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
    try {
      const { name, email, password } = req.body;
      const nPassword = await bcrypt.hash(password, 8);

      const data = await userModel.insertOne({
        name,
        email,
        password: nPassword,
        authProvider: 'local',
      });
      res.status(201).json({ data });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Erro ao criar usuário' });
    }
  }
  public async readUser(req: Request, res: Response): Promise<any> {
    try {
      const { email, password } = req.body;
      const data = await userModel.findOne({ email: email });

      if (!data || !data.password) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      const isPasswordValid = await bcrypt.compare(password, data.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Senha incorreta' });
      }

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
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Erro ao buscar usuário' });
    }
  }
  public async AuthWithGoogle(req: Request, res: Response): Promise<any> {
    try {
      const { idToken } = req.params;
      const client = new OAuth2Client(config.CLIENT_ID);

      const tiket = await client.verifyIdToken({
        idToken,
        audience: config.CLIENT_ID,
      });

      const payload = tiket.getPayload();

      if (!payload) {
        return res.status(401).json({ message: 'Token inválido' });
      }

      let user = await userModel.findOne({ googleId: payload.sub });

      if (!user) {
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

      const token = jwt.sign(user.id, jwtSecret, {});

      return res.status(200).json({
        message: 'Sucesso no Login',
        token: token,
        user: {
          id: user.id,
          authProvider: user.authProvider,
          name: user.name,
          email: user.email,
          elderly: user.eldely,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Erro ao autenticar com Google' });
    }
  }

  public async updatePassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email, currentPassword, newPassword } = req.body;
      const user = await userModel.findOne({ email: email });

      if (!user) {
        res.status(404).json({ message: 'Usuário não encontrado' });
        return;
      }

      const isPasswordValid = user.password
        ? await bcrypt.compare(currentPassword, user.password)
        : false;

      if (!isPasswordValid) {
        res.status(400).json({ message: 'Senha atual incorreta' });
        return;
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 8);
      await userModel.updateOne(
        { email: email },
        { $set: { password: hashedNewPassword } },
      );
      res.status(200).json({ message: 'Senha atualizada com sucesso' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Erro ao atualizar senha' });
    }
  }

  public async updateAvatar(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { user } = res.locals;

      if (!req.file) {
        res.status(400).json({ message: 'Sem nenhum upload de arquivo' });
        return;
      }

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
      console.log(error);
      res.status(500).json({ message: 'Erro ao atualizar avatar' });
    }
  }

  public async updatePushToken(req: Request, res: Response): Promise<Response> {
    try {
      const { user } = res.locals;
      const { pushToken } = req.body;

      if (!pushToken) {
        return res.status(400).json({ message: 'pushToken é obrigatório' });
      }

      await userModel.findByIdAndUpdate(user, {
        $set: { pushToken },
      });

      return res
        .status(200)
        .json({ message: 'Push token atualizado com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar push token:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}

export default new UserController();
