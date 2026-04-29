import { Request, Response } from "express";
import { ApiError } from "../libs/class/api-error.js";
import { Notification } from "../database/notification.model.js";
import { sendSystemNotification } from "../libs/utils/system-notification.js";
import { NotificationCreateInputType } from "./notification.schema.js";

//Create a new Notification
export const createNotificationController = async (req: Request, res: Response) => {
  const userID = req.params.id
  const notificationBody = req.body as NotificationCreateInputType

  // Individual Notification
  if (userID) {
    const notification = await sendSystemNotification({ userID, ...notificationBody });
    if (!notification) throw new ApiError(400, "Failed To Create Notification")
    return res.status(201).json({ success: true, message: "Notification sent to user successfully", data: notification});
  }

  //  Global Notification
  const notification = await Notification.create(notificationBody);
  if (!notification) throw new ApiError(400, "Failed To Create Notification")
  return res.status(201).json({ success: true, message: "Global notification created successfully", data: notification });

};

//Get the most recent Notification 
export const getLatestNotificationController = async (req: Request, res: Response) => {

  const user = req.user

  const countNotification = await Notification.countDocuments()
  if (countNotification === 0) {
    return res.status(200).json({ message: "There are no notification", count: 0, data: null, success: true })
  }

  const latestNotification = await Notification.findOne({ $or: [{ user: user?.id }, { user: null }] }).sort({ createdAt: -1 })
  return res.status(200).json({ message: "The most recent notification is ", data: latestNotification, success: true})

}

//Get all the Notification 
export const getAlltNotificationController = async (req: Request, res: Response) => {

  const user = req.user

  const countNotification = await Notification.countDocuments()
  if (countNotification === 0) {
    return res.status(200).json({ message: "There are no notification", count: 0, data: null, success: true })
  }

  const allNotification = await Notification.find({ $or: [{ user: user?.id }, { user: null }] }).sort({ createdAt: -1 }).lean()
  return res.status(200).json({ message: "The notifications are  ", data: allNotification, success: true })

}


//Update Notification 
export const updateNotificationController = async (req: Request, res: Response) => {
  const ID = req.params.id

//   const { type, title, description } = req.body
  //Sabse pehle Db mein existing notification dhundho 
  const updatedNotification = await Notification.findByIdAndUpdate(ID, req.body, { new: true })

  if (!updatedNotification) {
    throw new ApiError(404, "Notification not found")
  }

  return res.status(200).json({ message: "The notification has been updated successfully ", data: updatedNotification, success: true })
}

//Delete One Notification 
export const deleteNotificationController = async (req: Request, res: Response) => {

  const ID = req.params.id

  const notification = await Notification.findByIdAndDelete(ID)

  if (!notification) {
    throw new ApiError(404, "The notification was not found")
  }

  return res.status(200).json({ message: "The notification has been deleted successfully", success: true, data: null })
}


