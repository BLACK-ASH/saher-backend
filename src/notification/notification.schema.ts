import z from "zod"
import { notificationTypes } from "../database/notification.model.js"

export const createNotificationSchema = z.object({
    type : z.enum(notificationTypes) ,
    title : z.string() , 
    description : z.string() 
})