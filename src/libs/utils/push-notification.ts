import webpush from 'web-push';

import { PushSubscription } from '../../database/push-subscription.js';
import { ApiError } from '../class/api-error.js';
import 'dotenv/config';
import { logger } from '../logger/logger.js';

// VAPID setup (run once on import)
webpush.setVapidDetails(
  'mailto:admin@saherinternals.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sendPushToUser = async (userId: string, payload: any) => {
  const subscriptions = await PushSubscription.find({
    user: userId,
  });

  if (!subscriptions.length) {
    throw new ApiError(404, 'No push subscriptions found');
  }

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        },
        JSON.stringify(payload),
      ),
    ),
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const sub = subscriptions[i];

    if (result.status !== 'fulfilled') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err: any = result.reason;

      logger.error(
        {
          userId,
          endpoint: sub.endpoint,
          statusCode: err?.statusCode,
          message: err?.message,
        },
        'Push Failed',
      );

      // cleanup expired subscriptions
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await PushSubscription.deleteOne({
          endpoint: sub.endpoint,
        });
      }
    }
  }

  return true;
};
