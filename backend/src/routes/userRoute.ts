import { Router } from 'express';
import userController from '../controllers/UserController';
import { authenticateToken } from '../middlewares/jwt';

const routes = Router();

routes.post('/signin', userController.readUser);

routes.post(
  '/signup',

  userController.createUser,
);

routes.put('/updatePassword', authenticateToken, userController.updatePassword);

export default routes;
