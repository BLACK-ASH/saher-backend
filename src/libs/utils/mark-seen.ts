import { Notification } from '../../database/notification.model.js';
import { notificationResponseListSchema } from '../../notification/notification.schema.js';
import { createKey, getCache, setCache } from '../redis/redis-utils.js';

export const markSeenNotification = async (notificationId: string, userId: string) => {
  // mark the Db notification as seen

  const modified = await Notification.findByIdAndUpdate(
    notificationId,
    { isSeen: true, seenAt: new Date() },
    { new: true },
  );
  if (!modified)
    return { message: 'The notification was not found  in DB ', statusCode: 400, data: null };

  const key = createKey('notification', 'user', userId);
  const cached = await getCache(key);

  const parsedCached = notificationResponseListSchema.parse(cached || []);
  const changedCached = parsedCached.map((notification) => {
    if (notification.id == notificationId) {
      return {
        ...notification,
        isSeen: true,
        seenAt: new Date().toString(),
      };
    }
    return notification;
  });
  await setCache(key, changedCached, 604800);
  return {
    message: 'Notification marked as seen',
    statusCode: 200,
    data: modified,
  };
};
