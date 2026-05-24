import { Router } from 'express';

import {
  createNotificationController,
  deleteNotificationController,
  getAlltNotificationController,
  getLatestNotificationController,
  updateNotificationController,
} from './notification.controllers.js';
import { createNotificationSchema, updateNotificationSchema } from './notification.schema.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { authorize } from '../permission/authorize.js';

const notificationRouter = Router();

notificationRouter.get('/', getLatestNotificationController);
notificationRouter.get('/all', getAlltNotificationController);
notificationRouter.post(
  '/create/:id',
  authorize('write', 'notification'),
  validate(createNotificationSchema),
  createNotificationController,
);
notificationRouter.put(
  '/update/:id',
  authorize('update', 'notification'),
  validate(updateNotificationSchema),
  updateNotificationController,
);
notificationRouter.delete(
  '/delete',
  authorize('delete', 'notification'),
  deleteNotificationController,
);

export default notificationRouter;
