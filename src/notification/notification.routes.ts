import { Router } from "express";
import { createNotificationController, deleteAllNotificationController, deleteNotificationController, getAlltNotificationController, getLatestNotificationController, updateNotificationController } from "./notification.controllers.js";
import { authorize } from "../permission/authorize.js";
import { validate } from "../libs/middleware/validate-zod-schema.js";
import { createNotificationSchema, updateNotificationSchema } from "./notification.schema.js";

const notificationRouter = Router() 

notificationRouter.get("/" , getLatestNotificationController)
notificationRouter.get("/all" , getAlltNotificationController)
notificationRouter.post("/create" , authorize("write" , "notification") , validate(createNotificationSchema),  createNotificationController)
notificationRouter.put("/update/:id" , authorize("update" ,"notification") , validate(updateNotificationSchema) , updateNotificationController)
notificationRouter.delete("/delete/:id" , authorize("delete","notification"),deleteNotificationController)
notificationRouter.delete("/delete/All" , authorize("delete","notification"),deleteAllNotificationController)

export default notificationRouter 