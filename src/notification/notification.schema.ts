import { z } from 'zod';

import {
  notificationMethod,
  notificationScope,
  notificationTypes,
} from '../database/notification.model.js';
import type { NotificationType } from '../libs/class/notification.js';

const baseNotificationSchema = z.object({
  user: z.array(z.string()).optional(),
  type: z.enum(notificationTypes),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  scope: z.enum(notificationScope),
  action: z
    .object({
      type: z.enum(['download', 'navigate', 'external', 'none']),
      label: z.string(),
      url: z.string(),
      method: z.enum(notificationMethod).default('GET'),
    })
    .optional(),
});

export const sendNotificationSchema = baseNotificationSchema.superRefine((data, ctx) => {
  if (data.scope === 'specific' && !data.user) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'user is required when the scope is choosen as specific',
      path: ['user'],
    });
  }
});

export type SendNotificationT = z.infer<typeof sendNotificationSchema>;

export const _notificationResponseSchema = z
  .object({
    id: z.string(),
    user: z.string().optional().nullable(),
    type: z.enum(notificationTypes),
    title: z.string().min(1, 'Title can not be empty').max(100, 'Title is too long'),
    description: z
      .string()
      .min(1, 'Description can not be empty')
      .max(500, 'The description is too long'),
    action: z
      .object({
        type: z.enum(['download', 'navigate', 'external', 'none']),
        label: z.string().default('none'),
        url: z.string().default('none'),
        method: z.enum(notificationMethod).default('GET'),
      })
      .optional(),
    isSeen: z.boolean().optional().nullable(),
    seenAt: z.string().optional().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    expiresAt: z.string(),
  })
  .strip();

export const notificationResponseSchema = baseNotificationSchema
  .omit({ scope: true, user: true })
  .extend({
    id: z.string(),
    user: z.string(),
    isSeen: z.boolean(),
    seenAt: z.string().optional().nullable(),
    createdAt: z.string(),
    expiresAt: z.string(),
  })
  .readonly();

export const notificationResponseListSchema = z.array(notificationResponseSchema);

export type NotificationResponseT = z.infer<typeof notificationResponseSchema>;
export type NotificationResponseListT = NotificationResponseT[];

export type RoleScope = 'admin' | 'manager' | 'user' | 'intern';

type GlobalPayload = {
  scope: 'global';
  type: NotificationType;
  title: string;
  description: string;
  action?: NotificationAction;
  expiresAt: Date;
};

type RolePayload = {
  scope: RoleScope;
  type: NotificationType;
  title: string;
  description: string;
  action?: NotificationAction;
  expiresAt: Date;
};

type SpecificPayload = {
  scope: 'specific';
  user: string[];
  type: NotificationType;
  title: string;
  description: string;
  action?: NotificationAction;
  expiresAt: Date;
};

export type NotificationAction = {
  type: 'download' | 'navigate' | 'external' | 'none';
  label: string;
  url: string;
  method: typeof notificationMethod;
};

export type NotificationPayload = GlobalPayload | RolePayload | SpecificPayload;
