import { Router } from 'express';
import {
  createNotificationController,
  deleteNotificationController,
  getAlltNotificationController,
  getLatestNotificationController,
  updateNotificationController,
} from './notification.controllers.js';
import { authorize } from '../permission/authorize.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { notificationSchema} from './notification.schema.js';
// import { NotificationInputSchema } from '../libs/utils/system-notification.js';

const notificationRouter = Router();

notificationRouter.get('/', getLatestNotificationController);
notificationRouter.get('/all', getAlltNotificationController);
notificationRouter.post(
  '/create',
  authorize('write', 'notification'),
  validate(notificationSchema),
  createNotificationController,
);
// notificationRouter.put(
//   '/update/:id',
//   authorize('update', 'notification'),
//   validate(updateNotificationSchema),
//   updateNotificationController,
// );
notificationRouter.delete(
  '/delete',
  authorize('delete', 'notification'),
  deleteNotificationController,
);

export default notificationRouter;
