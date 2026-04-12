import { Notification, notificationTypes} from "../../database/notification.model.js"
import { z } from "zod";

export const sendNotificationSchema = z.object({
  user: z.string(),
  type: z.enum(notificationTypes),
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().min(1, "Description is required").max(1000, "Description too long"),
});


export const sendSystemNotification = async(functionParameter : unknown)=>{
    const parsedParameter = sendNotificationSchema.parse(functionParameter)

    const notification = await Notification.create(parsedParameter)

    return notification
}
