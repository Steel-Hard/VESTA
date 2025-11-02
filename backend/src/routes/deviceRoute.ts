import { Router } from 'express';

import deviceController from '../controllers/DeviceController';
const routes = Router();

routes.post('/', deviceController.createDevice);
routes.post('/metric/:id', deviceController.addNewMetric);
routes.get('/metric/:macAddress', deviceController.getTodayMetricsByMacAddress);
routes.get('/:id', deviceController.findDeviceById);
routes.put('/:id', deviceController.updateDevice);
routes.delete('/:id', deviceController.deleteDevice);

export default routes;
