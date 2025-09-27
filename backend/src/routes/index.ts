import { Router } from 'express';
import userController from './userRoute';
import elderController from './elderRoute';
import { authenticateToken } from '../middlewares/jwt';

const routes = Router();

routes.use('/auth', userController);

routes.use('/elder', authenticateToken, elderController);

routes.use((_: any, res: any) =>
  res.json({ error: 'Requisição desconhecida' }),
);

export default routes;
