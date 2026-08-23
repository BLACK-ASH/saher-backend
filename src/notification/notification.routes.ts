import { Router } from 'express';

import {
  createNotificationController,
  getAllNotificationsController,
  getUnseenNotification,
  markSeenNotificationController,
} from './notification.controllers.js';
import { notificationListQuerySchema, sendNotificationSchema } from './notification.schema.js';
import {
  disableNotificationController,
  enableNotificationController,
  subscribePushController,
} from './webpush.controller.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
// import { sendPushToUser } from '../libs/utils/push-notification.js';
import { authorize } from '../permission/authorize.js';
const notificationRouter = Router();
notificationRouter.get('/', validate(notificationListQuerySchema), getAllNotificationsController);
notificationRouter.get('/un-seen', getUnseenNotification);
notificationRouter.post(
  '/',
  authorize('write', 'notification'),
  validate(sendNotificationSchema),
  createNotificationController,
);
notificationRouter.patch('/:id', markSeenNotificationController);

// Web Push Notification
// save push subscription
notificationRouter.post('/subscribe', subscribePushController);

// mark enabled (optional sync endpoint)
notificationRouter.post('/enable', enableNotificationController);

// disable notifications
notificationRouter.post('/disable', disableNotificationController);

export default notificationRouter;
