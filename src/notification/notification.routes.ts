import { Router } from 'express';

import {
  createNotificationController,
  deleteNotificationController,
  getAllNotificationsController,
  getUnseenNotificationCount,
} from './notification.controllers.js';
import { SendNotificationSchema } from './notification.schema.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { authorize } from '../permission/authorize.js';

const notificationRouter = Router();

notificationRouter.get('/', getAllNotificationsController);
notificationRouter.post(
  '/',
  authorize('write', 'notification'),
  validate(SendNotificationSchema),
  createNotificationController,
);
// notificationRouter.put(
//   '/:id',
//   authorize('update', 'notification'),
//   validate(updateNotificationSchema),
//   updateNotificationController,
// );
notificationRouter.delete('/', authorize('delete', 'notification'), deleteNotificationController);
notificationRouter.get('/unSeenCount', getUnseenNotificationCount);

export default notificationRouter;
