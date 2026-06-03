import type { Request, Response } from 'express';

import { PushSubscription } from '../database/push-subscription.js';
import { User } from '../database/user.model.js';
import { ApiResponse } from '../libs/class/api-response.js';

/**
 * Save browser subscription
 */
export const subscribePushController = async (req: Request, res: Response) => {
  const userId = req.user?.id;
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

  return ApiResponse.success(res, {
    message: 'Push subscribed',
  });
};

export const enableNotificationController = async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(req.user?.id, {
    pushNotificationsEnabled: true,
  });

  return ApiResponse.success(res, {
    message: 'Notifications enabled',
  });
};

export const disableNotificationController = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  // delete all subscriptions of user
  await PushSubscription.deleteMany({ userId });

  // update user flag
  await User.findByIdAndUpdate(userId, {
    pushNotificationsEnabled: false,
  });

  return ApiResponse.success(res, {
    message: 'Notifications disabled',
  });
};
