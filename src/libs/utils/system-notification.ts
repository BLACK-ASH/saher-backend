import { Notification as NotificationModel } from '../../database/notification.model.js';
import {
  notificationResponseListSchema,
  notificationResponseSchema,
  NotificationResponseT,
} from '../../notification/notification.schema.js';

import {
  createKey,
  getCache,
  setCache,
} from '../redis/redis-utils.js';

import { normalizeDoc } from './normailize-doc.js';

export type NotificationType = "info" | "warn" | "error";

const ROLE_SCOPES = [
  "admin",
  "manager",
  "user",
  "intern"
];


class Notification {
  global = {
    info: (title: string, description: string) =>
      this.create({ scope: "global", type: "info", title, description }),

    warn: (title: string, description: string) =>
      this.create({ scope: "global", type: "warn", title, description }),

    error: (title: string, description: string) =>
      this.create({ scope: "global", type: "error", title, description }),
  };

  role = {
    info: (role: string, title: string, description: string) =>
      this.create({ scope: role, type: "info", title, description }),

    warn: (role: string, title: string, description: string) =>
      this.create({ scope: role, type: "warn", title, description }),

    error: (role: string, title: string, description: string) =>
      this.create({ scope: role, type: "error", title, description }),
  };

  specific = {
    info: (user: string, title: string, description: string) =>
      this.create({ scope: "specific", user, type: "info", title, description }),

    warn: (user: string, title: string, description: string) =>
      this.create({ scope: "specific", user, type: "warn", title, description }),

    error: (user: string, title: string, description: string) =>
      this.create({ scope: "specific", user, type: "error", title, description }),
  };

  private async create(payload: any) {
    const data = {
      ...payload,
      timestamp: new Date(),
    };

    const saved = await this.saveToDB(data);

    const normalized = normalizeDoc(saved.toObject());

    const parsed = notificationResponseSchema.parse(normalized);


    // GLOBAL
    if (payload.scope === "global") {
      const key = createKey("notification", "global");

      await this.appendToCache(key, parsed);
    }

    // ROLE
    if (ROLE_SCOPES.includes(payload.scope) ) {
      const key = createKey(
        "notification",
        "role",
        payload.scope
      );

      await this.appendToCache(key, parsed);
    }

    // USER
    if (payload.scope === "specific") {
      
        const key = createKey(
          "notification",
          "user",
          payload.user
        );

        await this.appendToCache(key, parsed);
      
    }
    return parsed;
  }

  private async appendToCache(
    key: string,
    notification: NotificationResponseT
  ) {
    const existingRaw = await getCache(key);

    const existing =
      notificationResponseListSchema.parse(
        existingRaw || []
      );

    const updated = [
      notification,
      ...existing,
    ].slice(0, 100);

    await setCache(key, updated, 604800);
  }

  private async saveToDB(data: any) {
    return NotificationModel.create(data);
  }
}

export const NotificationService = new Notification;























// import mongoose from 'mongoose';
// import { Notification } from '../../database/notification.model.js';
// import { notificationResponseListSchema, notificationResponseSchema, SendNotificationT } from '../../notification/notification.schema.js';
// import { createKey, deleteCache, deleteCacheGroup, setCache, setCacheWithGroup } from '../redis/redis-utils.js';
// import { ApiError } from '../class/api-error.js';
// import { normalizeDoc } from './normailize-doc.js';
// import { normalize } from 'node:path';




// class NotificationClass {
//   global = {
//     info: (title: string, desc: string) =>
//       this.create({ scope: "global", type: "info", title, desc }),

//     warn: (title: string, desc: string) =>
//       this.create({ scope: "global", type: "warn", title, desc }),

//     error: (title: string, desc: string) =>
//       this.create({ scope: "global", type: "error", title, desc }),
//   };

//   role = {
//     info: (role: string, title: string, desc: string) =>
//       this.create({ scope: "role", role, type: "info", title, desc }),

//     warn: (role: string, title: string, desc: string) =>
//       this.create({ scope: "role", role, type: "warn", title, desc }),

//     error: (role: string, title: string, desc: string) =>
//       this.create({ scope: "role", role, type: "error", title, desc }),
//   };

//   specific = {
//     info: (users: string[], title: string, desc: string) =>
//       this.create({ scope: "specific", users, type: "info", title, desc }),

//     warn: (users: string[], title: string, desc: string) =>
//       this.create({ scope: "specific", users, type: "warn", title, desc }),

//     error: (users: string[], title: string, desc: string) =>
//       this.create({ scope: "specific", users, type: "error", title, desc }),
//   };

//   // 🔹 ONLY stores
//   private async create(payload: any) {
//     const data = {
//       ...payload,
//       timestamp: new Date(),
//     };

//     await this.saveToDB(data);

//     if (payload.scope === "global") {
//       const record = await Notification.find({ scope: "global" }).sort({ createdAt: -1 }).lean()
//       const normalized = normalizeDoc(record)
//       const parsed = notificationResponseListSchema.parse(normalized)
//       // await deleteCache("notification");
//       const globalKey = createKey('notification', 'global')

//       await setCache(globalKey, parsed, 604800)
//     }

//     if (payload.scope === "role") {
//       const scopeKey = createKey("notification", "role", payload.role)
//       const record = await Notification.find({ scope: payload.role })
//       const normalized = normalizeDoc(record)
//       const parsed = notificationResponseListSchema.parse(normalized)

//       // await deleteCache(key);
//       await setCache(scopeKey, parsed, 604800)
//     }

//     if (payload.scope === "specific") {
//       for (const userId of payload.users) {
//         const key = createKey("notification", "user", userId)
//         const record = await Notification.find({ user: userId })
//         const normalized = normalizeDoc(record)
//         const parsed = notificationResponseListSchema.parse(normalized)
//         // await deleteCache(key);
//         await setCache(key,parsed, 604800)
//       }
//     }
//   }

//   private async saveToDB(data: any) {
//     const saved = await Notification.create(data)
//   }
// }

// export const NotificationService = new NotificationClass();


