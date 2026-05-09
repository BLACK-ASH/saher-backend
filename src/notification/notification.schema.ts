import z from 'zod';

import { notificationTypes } from '../database/notification.model.js';

export const createNotificationSchema = z.object({
  type: z.enum(notificationTypes),
  title: z.string().min(1, 'Title can not be empty').max(30, 'Title is too long'),
  description: z
    .string()
    .min(1, 'Description can not be empty')
    .max(1000, 'The description is too long'),
});

export const updateNotificationSchema = createNotificationSchema.partial();

export type NotificationCreateInputType = z.infer<typeof createNotificationSchema>;
export type NotificationUpdateInputType = z.infer<typeof updateNotificationSchema>;
