import z from "zod"
import { notificationTypes } from "../database/notification.model.js"

export const createNotificationSchema = z.object({
    type : z.enum(notificationTypes) ,
    title : z.string().min(1).max(30) , 
    description : z.string().min(1).max(1000) 
})