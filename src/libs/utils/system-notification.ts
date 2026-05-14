// import { normalizeDoc } from './normailize-doc.js';
import { convertToObjectId } from './convert-object-id.js';
import { normalizeDoc } from './normailize-doc.js';
import { Notification as NotificationModel } from '../../database/notification.model.js';
import { User } from '../../database/user.model.js';
import type {
  NotificationAction,
  NotificationResponseT,
  notificationResponseListSchema,
  type NotificationPayload,
  type RoleScope,
} from '../../notification/notification.schema.js';
import { ApiResponse } from '../class/api-response.js';
import { createKey, getCache, setCache } from '../redis/redis-utils.js';
export type NotificationType = 'info' | 'warn' | 'error';
class Notification {
  global = {
    info: (title: string, description: string, action?: NotificationAction) =>
      this.create({
        scope: 'global',
        type: 'info',
        title,
        description,
        action,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),

    warn: (title: string, description: string, action?: NotificationAction) =>
      this.create({
        scope: 'global',
        type: 'warn',
        title,
        description,
        action,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 5),
      }),

    error: (title: string, description: string, action?: NotificationAction) =>
      this.create({
        scope: 'global',
        type: 'error',
        title,
        description,
        action,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 7),
      }),
  };

  role = {
    info: (role: RoleScope, title: string, description: string, action?: NotificationAction) =>
      this.create({
        scope: role,
        type: 'info',
        title,
        description,
        action,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),

    warn: (role: RoleScope, title: string, description: string, action?: NotificationAction) =>
      this.create({
        scope: role,
        type: 'warn',
        title,
        description,
        action,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 5),
      }),

    error: (role: RoleScope, title: string, description: string, action?: NotificationAction) =>
      this.create({
        scope: role,
        type: 'error',
        title,
        description,
        action,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 7),
      }),
  };

  specific = {
    info: (user: string[], title: string, description: string, action?: NotificationAction) =>
      this.create({
        scope: 'specific',
        user,
        type: 'info',
        title,
        description,
        action,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),

    warn: (user: string[], title: string, description: string, action?: NotificationAction) =>
      this.create({
        scope: 'specific',
        user,
        type: 'warn',
        title,
        description,
        action,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 5),
      }),

    error: (user: string[], title: string, description: string, action?: NotificationAction) =>
      this.create({
        scope: 'specific',
        user,
        type: 'error',
        title,
        description,
        action,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 7),
      }),
  };

  // 🔹 ONLY stores
  private async create(payload: NotificationPayload) {
    const data = {
      ...payload,
      timestamp: new Date(),
    };

    await this.saveToDB(data);
  }

  private async updateCaches(notifications: NotificationResponseT[]) {
    await Promise.all(
      notifications.map((notification) => {
        if (!notification.user) return Promise.resolve();

        const key = createKey('notification', 'user', notification.user.toString());

        return this.appendToCache(key, notification);
      }),
    );
  }

  private async appendToCache(key: string, notification: NotificationResponseT) {
    const existingRaw = await getCache(key);

    const existing = notificationResponseListSchema.parse(existingRaw || []);

    const now = new Date();

    const filtered = existing.filter((n) => {
      return new Date(n.expiresAt) > now;
    });

    const updated = [notification, ...filtered].slice(0, 100);

    await setCache(key, updated, 604800);
  }

  private async saveToDB(data: NotificationPayload) {
    if (data.scope === 'global') {
      // const key = createKey("notification", "global")
      const user = await User.find().select('_id').lean();

      const notifications = user.map((obj) => ({
        user: obj._id,
        title: data.title,
        type: data.type,
        description: data.description,
        expiresAt: data.expiresAt,
        action: data.action,
        scope: 'global',
      }));

      const inserted = await NotificationModel.insertMany(notifications);
      const normalized = normalizeDoc(inserted) as { _doc: NotificationResponseT }[];
      const cleaned = normalized.map((doc: any) => doc._doc);
      const parsed = notificationResponseListSchema.parse(cleaned);
      await this.updateCaches(parsed);
      return parsed;
    } else if (data.scope === 'specific') {
      const notifications = data.user.map((obj) => ({
        user: obj,
        title: data.title,
        type: data.type,
        description: data.description,
        expiresAt: data.expiresAt,
        action: data.action,
        scope: 'specific',
      }));

      const inserted = await NotificationModel.insertMany(notifications);
      const normalized = normalizeDoc(inserted) as { _doc: NotificationResponseT }[];
      const cleaned = normalized.map((doc: any) => doc._doc);
      const parsed = notificationResponseListSchema.parse(cleaned);
      await this.updateCaches(parsed);
      return parsed;
    }
    // global scope and specific scope handle karne ke baad sirf role scopes bach gaye
    const users = await User.find({ role: data.scope }).select('_id').lean();

    const notifications = users.map((obj) => ({
      user: obj._id,
      title: data.title,
      type: data.type,
      description: data.description,
      expiresAt: data.expiresAt,
      action: data.action,
      scope: data.scope,
    }));

    const inserted = await NotificationModel.insertMany(notifications);
    const normalized = normalizeDoc(inserted) as { _doc: NotificationResponseT }[];
    const cleaned = normalized.map((doc: any) => doc._doc);
    const parsed = notificationResponseListSchema.parse(cleaned);
    await this.updateCaches(parsed);
    return parsed;

    // return NotificationModel.create(data);
  }
}
export const NotificationService = new Notification();

export const markSeenNotification = async (notificationId: string, userId: string) => {
  // mark the Db notification as seen

  const modified = await NotificationModel.findByIdAndUpdate(
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
// const ROLE_SCOPES = ['admin', 'manager', 'user', 'intern'];

// class Notification {
//   global = {
//     info: (title: string, description: string) =>
//       this.create({
//         scope: 'global',
//         type: 'info',
//         title,
//         description,
//         expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
//       }),

//     warn: (title: string, description: string) =>
//       this.create({
//         scope: 'global',
//         type: 'warn',
//         title,
//         description,
//         expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 5),
//       }),

//     error: (title: string, description: string) =>
//       this.create({
//         scope: 'global',
//         type: 'error',
//         title,
//         description,
//         expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 7),
//       }),
//   };

//   role = {
//     info: (role: RoleScope, title: string, description: string) =>
//       this.create({
//         scope: role,
//         type: 'info',
//         title,
//         description,
//         expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
//       }),

//     warn: (role: RoleScope, title: string, description: string) =>
//       this.create({
//         scope: role,
//         type: 'warn',
//         title,
//         description,
//         expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 5),
//       }),

//     error: (role: RoleScope, title: string, description: string) =>
//       this.create({
//         scope: role,
//         type: 'error',
//         title,
//         description,
//         expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 7),
//       }),
//   };

//   specific = {
//     info: (user: string, title: string, description: string) =>
//       this.create({
//         scope: 'specific',
//         user,
//         type: 'info',
//         title,
//         description,
//         expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
//       }),

//     warn: (user: string, title: string, description: string) =>
//       this.create({
//         scope: 'specific',
//         user,
//         type: 'warn',
//         title,
//         description,
//         expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 5),
//       }),

//     error: (user: string, title: string, description: string) =>
//       this.create({
//         scope: 'specific',
//         user,
//         type: 'error',
//         title,
//         description,
//         expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 7),
//       }),
//   };

//   private async create(payload: NotificationPayload) {
//     const data = {
//       ...payload,
//       timestamp: new Date(),
//     };

//     const saved = await this.saveToDB(data);
//     const normalized = normalizeDoc(saved.toObject());
//     const parsed = notificationResponseSchema.parse(normalized);

//     // GLOBAL
//     if (payload.scope === 'global') {
//       const key = createKey('notification', 'global');
//       await this.appendToCache(key, parsed);
//     }

//     // ROLE
//     if (ROLE_SCOPES.includes(payload.scope)) {
//       const key = createKey('notification', 'role', payload.scope);
//       await this.appendToCache(key, parsed);
//     }

//     // USER
//     // if (payload.scope === 'specific') {
//     //   const key = createKey('notification', 'user', payload.user);
//     //   await this.appendToCache(key, parsed);
//     // }
//     return parsed;
//   }

//   private async appendToCache(key: string, notification: NotificationResponseT) {
//     const existingRaw = await getCache(key);

//     const existing = notificationResponseListSchema.parse(existingRaw || []);

//     const now = new Date();

//     const filtered = existing.filter((n) => {
//       return new Date(n.expiresAt) > now;
//     });

//     const updated = [notification, ...filtered].slice(0, 100);

//     await setCache(key, updated, 604800);
//   }

//   private async saveToDB(data: NotificationPayload) {
//     return NotificationModel.create(data);
//   }
// }
// export const NotificationService = new Notification();
