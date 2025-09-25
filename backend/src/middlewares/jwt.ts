import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const jwtSecret = process.env.JWT_SECRET || 'default-secret';

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ err: 'Token não fornecido' });
    return;
  }

  try {
    const [, token] = authHeader.split(' ');
    const decoded = jwt.verify(token, jwtSecret as string) as any;

    if (!decoded) {
      res.status(401).json({ err: 'Não Autorizado' });
      return;
    }

    // Armazenamos a informação decodificada do token no res.locals para uso em controladores subsequentes
    res.locals.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ err: 'Token inválido ou expirado' });
    return;
  }
}
