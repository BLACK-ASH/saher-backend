import type { Request, Response } from 'express';

import type { NotificationAction, NotificationResponseListT } from './notification.schema.js';
import { notificationResponseListSchema } from './notification.schema.js';
import { Notification } from '../database/notification.model.js';
import { ApiError } from '../libs/class/api-error.js';
import { ApiResponse } from '../libs/class/api-response.js';
import type { NotificationType } from '../libs/class/notification.js';
import { createKey, getCache, setCache } from '../libs/redis/redis-utils.js';
import { markSeenNotification } from '../libs/utils/mark-seen.js';
import { normalizeDoc } from '../libs/utils/normailize-doc.js';
import { notification } from '../libs/utils/notification.js';

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

  switch (scope) {
    case 'global':
      await notification.global[type](title, description, action);
      break;

    case 'admin':
      await notification.role[type](scope, title, description, action);
      break;

    case 'manager':
      await notification.role[type](scope, title, description, action);
      break;

    case 'user':
      await notification.role[type](scope, title, description, action);
      break;

    case 'intern':
      await notification.role[type](scope, title, description, action);
      break;

    case 'specific':
      if (!user) throw new ApiError(400, 'User is required');
      await notification.specific[type](user, title, description, action);
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

  // validated+defaults via validate(notificationListQuerySchema)
  const { page, limit } = req.query as unknown as { page: number; limit: number };

  const userId = user.id;
  const key = createKey('notification', 'user', userId.toString());
  let parsed: NotificationResponseListT;

  const cacheRaw = await getCache(key);
  if (cacheRaw) {
    parsed = notificationResponseListSchema.parse(cacheRaw);
  } else {
    const role = req.user?.role;
    const notifications = await Notification.find({
      $or: [{ user: user?.id, scope: 'specific' }, { scope: role }, { scope: 'global' }],
    })
      .sort({ createdAt: -1 })
      .lean();

    parsed = notificationResponseListSchema.parse(normalizeDoc(notifications));
    await setCache(key, parsed, 604800);
  }

  // Slice after cache/DB so both paths paginate identically
  const skip = (page - 1) * limit;
  const pageData = parsed.slice(skip, skip + limit);

  return ApiResponse.success(res, {
    message: 'Notifications fetched',
    statusCode: 200,
    data: pageData,
    meta: {
      page,
      limit,
      count: parsed.length,
      total: Math.ceil(parsed.length / limit),
    },
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
    message: 'Notification marked as seen',
    data: result,
  });
};

export const getUnseenNotification = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const unseenNotification = await Notification.find({
    user: userId,
    isSeen: false,
  });

  return ApiResponse.success(res, {
    message: 'You have new Notification ',
    data: unseenNotification,
    meta: { count: unseenNotification.length },
  });
};
