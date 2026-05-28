import { Router } from 'express';

import {
  createNotificationController,
  getAllNotificationsController,
  getUnseenNotification,
  markSeenNotificationController,
} from './notification.controllers.js';
import { sendNotificationSchema } from './notification.schema.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { authorize } from '../permission/authorize.js';

const notificationRouter = Router();

notificationRouter.get('/', getAllNotificationsController);
notificationRouter.get('/un-seen', getUnseenNotification);
notificationRouter.post(
  '/',
  authorize('write', 'notification'),
  validate(sendNotificationSchema),
  createNotificationController,
);
notificationRouter.patch('/:id', markSeenNotificationController);

export default notificationRouter;
