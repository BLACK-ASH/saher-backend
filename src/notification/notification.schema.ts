import z from 'zod';
import { notificationScope, notificationTypes } from '../database/notification.model.js';



export const notificationSchema = z.object({
  user: z.array(z.string()).optional(),
  type: z.enum(notificationTypes),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  scope: z.string()
});

export const notificationResponseSchema = z.object({ 
  id : z.string()  ,
  // user : z.string().nullable(),
  type: z.enum(notificationTypes),
  title: z.string().min(1, 'Title can not be empty').max(30, 'Title is too long'),
  description: z
    .string()
    .min(1, 'Description can not be empty')
    .max(1000, 'The description is too long'),
    scope : z.enum(notificationScope)
}).strip();

export const notificationResponseListSchema = z.array(notificationResponseSchema)


export type NotificationResponseT = z.infer<typeof notificationResponseSchema>

// export const updateNotificationSchema = createNotificationSchema.partial();

// export type NotificationCreateInputType = z.infer<typeof createNotificationSchema>;
// export type NotificationUpdateInputType = z.infer<typeof updateNotificationSchema>;