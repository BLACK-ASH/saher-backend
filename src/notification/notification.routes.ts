import { Router } from 'express';

import {
  createNotificationController,
  getAllNotificationsController,
  getUnseenNotification,
  markSeenNotificationController,
} from './notification.controllers.js';
import { sendNotificationSchema } from './notification.schema.js';
import {
  disableNotificationController,
  enableNotificationController,
  subscribePushController,
} from './webpush.controller.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
// import { sendPushToUser } from '../libs/utils/push-notification.js';
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

// Web Push Notification
// save push subscription
notificationRouter.post('/subscribe', subscribePushController);

// mark enabled (optional sync endpoint)
notificationRouter.post('/enable', enableNotificationController);

// disable notifications
notificationRouter.post('/disable', disableNotificationController);

// notificationRouter.get('/push-test', async (req, res) => {
//   console.log('Web Push Hit');
//   await sendPushToUser(req.user?.id!, {
//     title: 'Test Push',
//     body: 'If you see this, push is working 🎉',
//     url: '/',
//   });

//   res.json({ success: true });
// });
//
export default notificationRouter;
