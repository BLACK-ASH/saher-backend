import type { Request, Response } from 'express';

import { PushSubscription } from '../database/push-subscription.js';
import { User } from '../database/user.model.js';
import { ApiError } from '../libs/class/api-error.js';
import { ApiResponse } from '../libs/class/api-response.js';
import { createKey, deleteCache } from '../libs/redis/redis-utils.js';
import { sendPushToUser } from '../libs/utils/push-notification.js';

/**
 * Save browser subscription
 */
export const subscribePushController = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(403, 'forbidden');

  const subscription = req.body;

  await PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    {
      user: userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    },
    { upsert: true, new: true },
  );

  await User.findByIdAndUpdate(userId, {
    pushNotificationsEnabled: true,
  });

  const key2 = createKey('user', userId);
  const key3 = createKey('account', 'userId', userId);

  await deleteCache(key2);
  await deleteCache(key3);

  await sendPushToUser(userId, {
    title: 'Notifications Enable',
    body: 'If you see this, push notification is working 🎉',
    url: '/',
  });

  return ApiResponse.success(res, {
    message: 'Push subscribed',
  });
};

export const enableNotificationController = async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(req.user?.id, {
    pushNotificationsEnabled: true,
  });

  const userId = req.user?.id;
  if (!userId) throw new ApiError(403, 'forbidden');

  const key2 = createKey('user', userId);
  const key3 = createKey('account', 'userId', userId);

  await deleteCache(key2);
  await deleteCache(key3);

  return ApiResponse.success(res, {
    message: 'Notifications enabled',
  });
};

export const disableNotificationController = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(403, 'forbidden');

  // delete all subscriptions of user
  await PushSubscription.deleteMany({ userId });

  // update user flag
  await User.findByIdAndUpdate(userId, {
    pushNotificationsEnabled: false,
  });

  const key2 = createKey('user', userId);
  const key3 = createKey('account', 'userId', userId);

  await deleteCache(key2);
  await deleteCache(key3);
  return ApiResponse.success(res, {
    message: 'Notifications disabled',
  });
};
