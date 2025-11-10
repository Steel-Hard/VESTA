import { Router } from 'express';
import userController from '../controllers/UserController';
import { authenticateToken } from '../middlewares/jwt';
import upload from '../middlewares/upload';

const routes = Router();

routes.post('/signin', userController.readUser);

routes.post('/signup', userController.createUser);

routes.post('/google/:idToken', userController.AuthWithGoogle);

routes.put('/updatePassword', authenticateToken, userController.updatePassword);

routes.patch(
  '/upload',
  authenticateToken,
  upload.single('photo'),
  userController.updateAvatar,
);

export default routes;
