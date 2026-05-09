import z from 'zod';

import { notificationScope, notificationTypes } from '../database/notification.model.js';
import type { NotificationType } from '../libs/utils/system-notification.js';

const BaseNotificationSchema = z.object({
  user: z.string().optional(),
  type: z.enum(notificationTypes),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  scope: z.enum(notificationScope),
});

export const SendNotificationSchema = BaseNotificationSchema.superRefine((schema, obj) => {
  if (schema.scope === 'specific' && !schema.user) {
    obj.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'user is required when the scope is choosen as specific',
      path: ['user'],
    });
  }
  // if(schema.scope !== "specific" && schema.user && schema.user.length > 0 ){
  //   obj.addIssue({
  //     code : z.ZodIssueCode.custom ,
  //     message : "There ius no need for user when scope is not specific",
  //     path : ["user"]
  //   })
  // }
});

export type SendNotificationT = z.infer<typeof SendNotificationSchema>;

export const updateNotificationSchema = BaseNotificationSchema.partial();

export const notificationResponseSchema = z
  .object({
    id: z.string(),
    user: z.string().optional().nullable(),
    type: z.enum(notificationTypes),
    title: z.string().min(1, 'Title can not be empty').max(30, 'Title is too long'),
    description: z
      .string()
      .min(1, 'Description can not be empty')
      .max(1000, 'The description is too long'),
    scope: z.enum(notificationScope),
    createdAt: z.string(),
    updatedAt: z.string(),
    expiresAt: z.string(),
  })
  .strip();

export const notificationResponseListSchema = z.array(notificationResponseSchema);

export type NotificationResponseListT = z.infer<typeof notificationResponseListSchema>;

export type NotificationResponseT = z.infer<typeof notificationResponseSchema>;

export type RoleScope = 'admin' | 'manager' | 'user' | 'intern';

type GlobalPayload = {
  scope: 'global';
  type: NotificationType;
  title: string;
  description: string;
  expiresAt: Date;
};

type RolePayload = {
  scope: RoleScope;
  type: NotificationType;
  title: string;
  description: string;
  expiresAt: Date;
};

type SpecificPayload = {
  scope: 'specific';
  user: string;
  type: NotificationType;
  title: string;
  description: string;
  expiresAt: Date;
};

export type NotificationPayload = GlobalPayload | RolePayload | SpecificPayload;
