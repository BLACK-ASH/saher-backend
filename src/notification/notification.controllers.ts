import type { Request, Response } from 'express';

import type { NotificationAction } from './notification.schema.js';
import { notificationResponseListSchema } from './notification.schema.js';
import { Notification } from '../database/notification.model.js';
import { ApiError } from '../libs/class/api-error.js';
import { ApiResponse } from '../libs/class/api-response.js';
import type { NotificationType } from '../libs/class/system-notification.js';
import { createKey, getCache, setCache } from '../libs/redis/redis-utils.js';
import { markSeenNotification } from '../libs/utils/mark-seen.js';
import { normalizeDoc } from '../libs/utils/normailize-doc.js';
import { notificationService } from '../libs/utils/notification.service.js';

export const createNotificationController = async (req: Request, res: Response) => {
  const {
    scope,
    type,
    title,
    description,
    user,
    action,
  }: {
    scope: string;
    type: NotificationType;
    title: string;
    description: string;
    user?: string[];
    action: NotificationAction;
  } = req.body;

  let result;

  switch (scope) {
    case 'global':
      result = await notificationService.global[type](title, description, action);
      break;

    case 'admin':
    case 'manager':
    case 'user':
    case 'intern':
      result = await notificationService.role[type](scope, title, description, action);
      break;

    case 'specific':
      if (!user) throw new ApiError(400, 'User is required');

      result = await notificationService.specific[type](user, title, description, action);
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
  if (!user) throw new ApiError(401, 'Unauthorized');

  const userId = user.id;
  const key = createKey('notification', 'user', userId.toString());
  const cacheRaw = await getCache(key);
  if (cacheRaw) {
    const parsedCache = notificationResponseListSchema.parse(cacheRaw);
    return ApiResponse.success(res, {
      message: 'Notifications fetched from cache',
      statusCode: 200,
      data: parsedCache,
    });
  }

  // Agr cache faiL huwa toh DB CAll
  const role = req.user?.role;
  const notifications = await Notification.find({
    $or: [{ user: user?.id, scope: 'specific' }, { scope: role }, { scope: 'global' }],
  }).lean();

  if (notifications.length === 0) {
    return ApiResponse.success(res, {
      message: 'You have no notification',
      data: null,
      statusCode: 200,
    });
  }

  const normalized = normalizeDoc(notifications);
  const parsed = notificationResponseListSchema.parse(normalized);
  await setCache(key, parsed, 604800);

  return ApiResponse.success(res, {
    message: 'Notifications fetched from cache',
    statusCode: 200,
    data: parsed,
  });
};

export const markSeenNotificationController = async (req: Request, res: Response) => {
  const notificationId = req.params.id as string;
  const userId = req.user?.id as string;

  if (!notificationId) {
    throw new ApiError(400, 'Notification id is required');
  }

  const result = await markSeenNotification(notificationId, userId);

  return ApiResponse.success(res, {
    message: result.message,
    data: result.data,
    statusCode: result.statusCode,
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
