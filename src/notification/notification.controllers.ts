import type { Request, Response } from 'express';

import type { NotificationResponseListT } from './notification.schema.js';
import { notificationResponseListSchema } from './notification.schema.js';
import { Notification } from '../database/notification.model.js';
import { ApiError } from '../libs/class/api-error.js';
import { ApiResponse } from '../libs/class/api-response.js';
import { createKey, deleteCacheGroup, getCache, setCache } from '../libs/redis/redis-utils.js';
import { normalizeDoc } from '../libs/utils/normailize-doc.js';
import type { NotificationType } from '../libs/utils/system-notification.js';
import { NotificationService } from '../libs/utils/system-notification.js';

export const createNotificationController = async (req: Request, res: Response) => {
  const {
    scope,
    type,
    title,
    description,
    user,
  }: { scope: string; type: NotificationType; title: string; description: string; user?: string } =
    req.body;

  let result;

  switch (scope) {
    case 'global':
      result = await NotificationService.global[type](title, description);
      break;

    case 'admin':
    case 'manager':
    case 'user':
    case 'intern':
      result = await NotificationService.role[type](scope, title, description);
      break;

    case 'specific':
      if (!user) throw new ApiError(400, 'User is required');

      result = await NotificationService.specific[type](user, title, description);
      break;

    default:
      throw new ApiError(400, 'Invalid scope');
  }
  return ApiResponse.success(res, {
    statusCode: 201,
    data: null,
    message: 'Notification created successfully',
  });
};

export const getAllNotificationsController = async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, 'Unauthorized');
  }

  const userId = user.id;
  const role = user.role;

  // CACHE KEYS
  const globalKey = createKey('notification', 'global');

  const roleKey = createKey('notification', 'role', role);

  const userKey = createKey('notification', 'user', userId);

  const globalCacheRaw = await getCache(globalKey);

  const roleCacheRaw = await getCache(roleKey);

  const userCacheRaw = await getCache(userKey);

  const globalCache = notificationResponseListSchema.parse(globalCacheRaw || []);

  const roleCache = notificationResponseListSchema.parse(roleCacheRaw || []);

  const userCache = notificationResponseListSchema.parse(userCacheRaw || []);

  // IF ALL CACHES EXIST
  const hasCache = globalCacheRaw !== null || roleCacheRaw !== null || userCacheRaw !== null;

  if (hasCache) {
    const merged: NotificationResponseListT = [...globalCache, ...roleCache, ...userCache];

    // newest first
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return ApiResponse.success(res, {
      message: 'Notifications fetched from cache',
      statusCode: 200,
      data: merged,
    });
  }

  const notifications = await Notification.find({
    $or: [{ scope: 'global' }, { scope: role }, { scope: 'specific', user: userId }],
  })
    .sort({ createdAt: -1 })
    .lean();

  const normalized = normalizeDoc(notifications);

  const parsed = notificationResponseListSchema.parse(normalized);

  // SPLIT DATA FOR CACHES
  const globalNotifications = parsed.filter((n) => n.scope === 'global');

  const roleNotifications = parsed.filter((n) => n.scope === role);

  const userNotifications = parsed.filter((n) => n.scope === 'specific');

  // SAVE SEPARATE CACHES
  await Promise.all([
    setCache(globalKey, globalNotifications, 604800),

    setCache(roleKey, roleNotifications, 604800),

    setCache(userKey, userNotifications, 604800),
  ]);

  return ApiResponse.success(res, {
    message: 'Notifications fetched from database',
    statusCode: 200,
    data: parsed,
  });
};

// //Update Notification
// export const updateNotificationController = async (req: Request, res: Response) => {
//   const ID = req.params.id;

//   const input = req.body;

//   //Sabse pehle Db mein existing notification dhundho
//   const previousNotification = await Notification.findById(ID).lean();

//   if (!previousNotification) {
//     throw new ApiError(404, 'Notification not found');
//   }

//   const final = { ...previousNotification, ...input };

//   if (input.scope && input.scope !== 'specific') {
//     final.user = undefined;
//   }

//   if (final.user) {
//     final.user = final.user.toString();
//   }

//   const validated = SendNotificationSchema.parse(final);

//   const updateQuery: Partial<SendNotificationT> & = { ...validated };

//   if (validated.scope !== 'specific') {
//     updateQuery.$unset = { user: '' };
//     delete updateQuery.user;
//   }

//   const updatedNotification = await Notification.findByIdAndUpdate(ID, updateQuery, {
//     new: true,
//     runValidators: true,
//   }).lean();

//   const normalized = normalizeDoc(updatedNotification);
//   const parsed = notificationResponseSchema.parse(normalized);

//   await deleteCacheGroup('notification');

//   return ApiResponse.success(res, {
//     message: 'The notification has been updated successfully ',
//     data: parsed,
//     statusCode: 200,
//   });
// };

//Delete One Notification
export const deleteNotificationController = async (req: Request, res: Response) => {
  const ID = req.params.id;

  const notification = await Notification.findByIdAndDelete(ID);

  if (!notification) {
    throw new ApiError(404, 'The notification was not found');
  }

  await deleteCacheGroup('notification');

  return ApiResponse.success(res, {
    message: 'The notification has been deleted successfully',
    data: null,
    statusCode: 200,
  });
};
