import { Router } from "express";
import { createNotificationController, getAlltNotificationController, getLatestNotificationController } from "./notification.controllers.js";
import { authorize } from "../permission/authorize.js";
import { validate } from "../libs/middleware/validate-zod-schema.js";
import { createNotificationSchema } from "./notification.schema.js";

const notificationRouter = Router() 

notificationRouter.get("/" , getLatestNotificationController)
notificationRouter.get("/all" , getAlltNotificationController)
notificationRouter.post("/create" , authorize("write" , "notification") , validate(createNotificationSchema),  createNotificationController)

export default notificationRouter 