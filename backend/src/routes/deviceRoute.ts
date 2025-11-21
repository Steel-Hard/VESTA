import { Router } from 'express';

import deviceController from '../controllers/DeviceController';
import { authenticateToken } from '../middlewares/jwt';

const routes = Router();

routes.post('/', deviceController.createDevice);
routes.post('/metric/:id', deviceController.addNewMetric);
routes.get('/metric/:macAddress', deviceController.getTodayMetricsByMacAddress);
routes.get(
  '/lastFallAlert',
  authenticateToken,
  deviceController.getLastFallAlertByUser,
);
routes.get('/:id', deviceController.findDeviceById);
routes.put('/:id', deviceController.updateDevice);
routes.delete('/:id', deviceController.deleteDevice);
routes.put(
  '/resolveFallAlert/:deviceId/:alertId',
  authenticateToken,
  deviceController.markAlertAsResolved,
);

export default routes;
