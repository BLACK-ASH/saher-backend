import { Router } from "express";
import { createGlobalNotificationController, createIndividualNotificationController, deleteAllNotificationController,  getAlltNotificationController, getLatestNotificationController, updateNotificationController } from "./notification.controllers.js";
import { authorize } from "../permission/authorize.js";
import { validate } from "../libs/middleware/validate-zod-schema.js";
import { createIndividualNotificationSchema, createNotificationSchema, updateNotificationSchema } from "./notification.schema.js";

const notificationRouter = Router() 

notificationRouter.get("/" , getLatestNotificationController)
notificationRouter.get("/all" , getAlltNotificationController)
notificationRouter.post("/create/global" , authorize("write" , "notification") , validate(createNotificationSchema),  createGlobalNotificationController)
notificationRouter.post("/create/systemNotification" , authorize("write","notification") , validate(createIndividualNotificationSchema) ,createIndividualNotificationController)
notificationRouter.put("/update/:id" , authorize("update" ,"notification") , validate(updateNotificationSchema) , updateNotificationController)
notificationRouter.delete("/delete/All" , authorize("delete","notification"),deleteAllNotificationController)


export default notificationRouter 