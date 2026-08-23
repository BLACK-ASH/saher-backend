import type { Request, Response } from 'express';
import z from 'zod';

import { PushSubscription } from '../database/push-subscription.js';
import { User } from '../database/user.model.js';
import { ApiError } from '../libs/class/api-error.js';
import { ApiResponse } from '../libs/class/api-response.js';
import { createKey, deleteCache } from '../libs/redis/redis-utils.js';
import { sendPushToUser } from '../libs/utils/push-notification.js';

// Browser PushSubscriptionJSON shape — never trust raw body here
const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

/**
 * Save browser subscription
 */
export const subscribePushController = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(403, 'forbidden');

  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, z.prettifyError(parsed.error));
  }
  const subscription = parsed.data;

  // An endpoint belongs to one browser+user — refuse to rebind someone else's row (hijack)
  const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });
  if (existing && !existing.user.equals(userId)) {
    throw new ApiError(403, 'This subscription endpoint is registered to another account');
  }

  await PushSubscription.findOneAndUpdate(
    { user: userId, endpoint: subscription.endpoint },
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

  // delete all subscriptions of user — model field is `user`, not `userId`
  await PushSubscription.deleteMany({ user: userId });

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
