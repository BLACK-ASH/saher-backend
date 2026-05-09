import { normalizeDoc } from './normailize-doc.js';
import { Notification as NotificationModel } from '../../database/notification.model.js';
import type {
  NotificationPayload,
  NotificationResponseT,
  RoleScope,
} from '../../notification/notification.schema.js';
import {
  notificationResponseListSchema,
  notificationResponseSchema,
} from '../../notification/notification.schema.js';
import { createKey, getCache, setCache } from '../redis/redis-utils.js';

export type NotificationType = 'info' | 'warn' | 'error';

const ROLE_SCOPES = ['admin', 'manager', 'user', 'intern'];

class Notification {
  global = {
    info: (title: string, description: string) =>
      this.create({
        scope: 'global',
        type: 'info',
        title,
        description,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),

    warn: (title: string, description: string) =>
      this.create({
        scope: 'global',
        type: 'warn',
        title,
        description,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 5),
      }),

    error: (title: string, description: string) =>
      this.create({
        scope: 'global',
        type: 'error',
        title,
        description,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 7),
      }),
  };

  role = {
    info: (role: RoleScope, title: string, description: string) =>
      this.create({
        scope: role,
        type: 'info',
        title,
        description,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),

    warn: (role: RoleScope, title: string, description: string) =>
      this.create({
        scope: role,
        type: 'warn',
        title,
        description,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 5),
      }),

    error: (role: RoleScope, title: string, description: string) =>
      this.create({
        scope: role,
        type: 'error',
        title,
        description,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 7),
      }),
  };

  specific = {
    info: (user: string, title: string, description: string) =>
      this.create({
        scope: 'specific',
        user,
        type: 'info',
        title,
        description,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),

    warn: (user: string, title: string, description: string) =>
      this.create({
        scope: 'specific',
        user,
        type: 'warn',
        title,
        description,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 5),
      }),

    error: (user: string, title: string, description: string) =>
      this.create({
        scope: 'specific',
        user,
        type: 'error',
        title,
        description,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 7),
      }),
  };

  private async create(payload: NotificationPayload) {
    const data = {
      ...payload,
      timestamp: new Date(),
    };

    const saved = await this.saveToDB(data);
    const normalized = normalizeDoc(saved.toObject());
    const parsed = notificationResponseSchema.parse(normalized);

    // GLOBAL
    if (payload.scope === 'global') {
      const key = createKey('notification', 'global');
      await this.appendToCache(key, parsed);
    }

    // ROLE
    if (ROLE_SCOPES.includes(payload.scope)) {
      const key = createKey('notification', 'role', payload.scope);
      await this.appendToCache(key, parsed);
    }

    // USER
    if (payload.scope === 'specific') {
      const key = createKey('notification', 'user', payload.user);
      await this.appendToCache(key, parsed);
    }
    return parsed;
  }

  private async appendToCache(key: string, notification: NotificationResponseT) {
    const existingRaw = await getCache(key);

    const existing = notificationResponseListSchema.parse(existingRaw || []);

    const updated = [notification, ...existing].slice(0, 100);

    await setCache(key, updated, 604800);
  }

  private async saveToDB(data: NotificationPayload) {
    return NotificationModel.create(data);
  }
}
export const NotificationService = new Notification();
