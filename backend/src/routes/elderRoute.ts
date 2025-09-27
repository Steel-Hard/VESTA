import { Router } from 'express';

import elderController from '../controllers/ElderController';
const routes = Router();

routes.post('/new', elderController.addElder);
routes.get('/:elderId', elderController.findOneElderByUser);
routes.get('/', elderController.findAllEldersByUser);
routes.put('/:elderId', elderController.updateElderById);
routes.delete('/:elderId', elderController.deleteElderById);

export default routes;
