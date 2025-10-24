import { Router } from 'express';
import userController from './userRoute';
import elderController from './elderRoute';
import deviceController from './deviceRoute';
import { authenticateToken } from '../middlewares/jwt';

const routes = Router();

routes.use('/auth', userController);

routes.use('/elder', authenticateToken, elderController);

routes.use('/device', deviceController);

routes.use((_: any, res: any) =>
  res.json({ error: 'Requisição desconhecida' }),
);

export default routes;
