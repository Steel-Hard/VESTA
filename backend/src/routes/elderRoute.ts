import { Router } from 'express';

import elderController from '../controllers/ElderController';
import { authenticateToken } from '../middlewares/jwt';
import upload from '../middlewares/upload';

const routes = Router();

routes.post(
  '/new',
  authenticateToken,
  upload.single('photo'),
  elderController.addElder,
);
routes.get('/:elderId', elderController.findOneElderByUser);
routes.get('/', elderController.findAllEldersByUser);
routes.put('/:elderId', elderController.updateElderById);
routes.delete('/:elderId', elderController.deleteElderById);

export default routes;
