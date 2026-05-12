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
  }: {
    scope: string;
    type: NotificationType;
    title: string;
    description: string;
    user?: string[];
  } = req.body;

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

  const result = await Notification.updateMany(
    {
      scope: 'specific',
      user: userId,
      isSeen: false,
    },
    {
      $set: {
        isSeen: true,
        seenAt: new Date(),
      },
    },
  );
  if (result.modifiedCount > 0) {
    const userSpecificRecord = await Notification.find({
      scope: 'specific',
      user: userId,
      isSeen: true,
    }).lean();
    const userSpecificNormalized = normalizeDoc(userSpecificRecord);
    const userSpecificParsed = notificationResponseListSchema.parse(userSpecificNormalized);
    await setCache(userKey, userSpecificParsed, 604800);
  }
  const userCacheRaw = await getCache(userKey);
  // const userUnseenNormalized = normalizeDoc(userUnseenRecord)
  // const userUnseenParsed = notificationResponseListSchema.parse(userUnseenNormalized)

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

  const globalRecord = await Notification.find({ scope: 'global' }).sort({ createdAt: -1 }).lean();
  const globalNormlaized = normalizeDoc(globalRecord);
  const globalNotifications = notificationResponseListSchema.parse(globalNormlaized || []);

  const roleRecord = await Notification.find({ scope: role }).sort({ createdAt: -1 }).lean();
  const roleNormalized = normalizeDoc(roleRecord);
  const roleNotifications = notificationResponseListSchema.parse(roleNormalized || []);

  const userRecord = await Notification.find({ scope: 'specific', user: userId }).lean();
  const userNormalized = normalizeDoc(userRecord);
  const userNotifications = notificationResponseListSchema.parse(userNormalized || []);

  // SAVE SEPARATE CACHES
  await Promise.all([
    setCache(globalKey, globalNotifications, 604800),

    setCache(roleKey, roleNotifications, 604800),

    setCache(userKey, userNotifications, 604800),
  ]);

  const merged: NotificationResponseListT = [
    ...globalNotifications,
    ...roleNotifications,
    ...userNotifications,
  ];

  return ApiResponse.success(res, {
    message: 'Notifications fetched from database',
    statusCode: 200,
    data: merged,
  });
};

export const getUnseenNotificationCount = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const unseenNotificationCount = await Notification.countDocuments({
    scope: 'specific',
    user: userId,
    isSeen: false,
  }).lean();

  if (unseenNotificationCount === 0) {
    return ApiResponse.success(res, {
      message: 'you have no  new notification',
      data: null,
      meta: { count: 0 },
    });
  }
  return ApiResponse.success(res, {
    message: 'You have new Notification ',
    data: null,
    meta: { count: unseenNotificationCount },
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
