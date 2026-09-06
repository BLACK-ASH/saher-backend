import type { Request, Response } from 'express';
import { Types, type QueryFilter } from 'mongoose';

import type { NotificationAction } from './notification.schema.js';
import { notificationResponseListSchema } from './notification.schema.js';
import { Notification } from '../database/notification.model.js';
import { ApiError } from '../libs/class/api-error.js';
import { ApiResponse } from '../libs/class/api-response.js';
import type { NotificationType } from '../libs/class/notification.js';
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

  // Number() coercion — query params arrive as strings
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  const userId = user.id;
  const role = req.user?.role;

  // Page straight from the DB — the old per-user Redis cache was append-only
  // and capped at 100, so lists drifted from the real (seen/unseen) state.
  const filter: QueryFilter<typeof Notification.schema.obj> = {
    $or: [
      { user: new Types.ObjectId(userId), scope: 'specific' },
      { scope: role },
      { scope: 'global' },
    ],
  };

  const [notifications, count] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as Promise<unknown[]>,
    Notification.countDocuments(filter),
  ]);

  const pageData = notificationResponseListSchema.parse(normalizeDoc(notifications));

  return ApiResponse.success(res, {
    message: 'Notifications fetched',
    statusCode: 200,
    data: pageData,
    meta: { page, limit, count, total: Math.ceil(count / limit) },
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
