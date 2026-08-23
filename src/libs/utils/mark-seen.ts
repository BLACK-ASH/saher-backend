import { Notification } from '../../database/notification.model.js';
import { notificationResponseListSchema } from '../../notification/notification.schema.js';
import { ApiError } from '../class/api-error.js';
import { createKey, getCache, setCache } from '../redis/redis-utils.js';

export const markSeenNotification = async (notificationId: string, userId: string) => {
  // mark the Db notification as seen

  // findOneAndUpdate with explicit criteria — findByIdAndUpdate(obj) ignores non-_id
  // keys, which let any user mark anyone's notification seen (IDOR)
  const modified = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isSeen: true, seenAt: new Date() },
    { new: true },
  );
  if (!modified) throw new ApiError(404, 'The notification was not found in DB');

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
  return modified;
};
