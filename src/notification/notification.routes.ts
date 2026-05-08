import { Router } from 'express';
import {
  createNotificationController,
  deleteNotificationController,
  getAllNotificationsController,
  updateNotificationController,
} from './notification.controllers.js';
import { authorize } from '../permission/authorize.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { SendNotificationSchema, updateNotificationSchema} from './notification.schema.js';

const notificationRouter = Router();

notificationRouter.get('/all', getAllNotificationsController);
notificationRouter.post(
  '/',
  authorize('write', 'notification'),
  validate(SendNotificationSchema),
  createNotificationController,
);
notificationRouter.put(
  '/:id',
  authorize('update', 'notification'),
  validate(updateNotificationSchema),
  updateNotificationController,
);
notificationRouter.delete(
  '/',
  authorize('delete', 'notification'),
  deleteNotificationController,
);

export default notificationRouter;
