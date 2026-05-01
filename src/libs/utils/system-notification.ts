// 

import { Notification, notificationScope, notificationTypes } from '../../database/notification.model.js';
import { z } from 'zod';
import { normalizeDoc } from './normailize-doc.js';
import { notificationResponseListSchema, notificationSchema } from '../../notification/notification.schema.js';
import { ApiResponse } from '../class/api-response.js';

export const SendNotificationSchema = z.object({
  user: z.array(z.string()).optional(),
  type: z.enum(notificationTypes),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  scope:z.enum(notificationScope)
});

export type SendNotificationT = z.infer<typeof SendNotificationSchema>;

export const sendNotification = async (input: SendNotificationT) => {

  const { user, type, title, description , scope } = input;


  const notification= await Notification.create({
    user,
    type,
    title,
    description,
    scope
  });
  return true 
};
  // const docs = new Notification(notification)
  // await docs.save()
  // console.log(docs)
  // let users: string[] = [];

  // if (typeof user === 'string') {
  //   users = [user];
  // } else if (Array.isArray(user)) {
  //   users = user;
  // }

 
  // docs.toJSON()  
  // console.log(docs)
  
  // console.log("docs: ")
  // const normalized = normalizeDoc(docs);
  // console.log("normalized : ")
  // console.log(normalized)
  // const response = notificationResponseListSchema.parse(normalized);