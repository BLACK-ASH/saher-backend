import { Request, Response } from 'express';
import { ApiError } from '../libs/class/api-error.js';
import { Notification } from '../database/notification.model.js';
import { sendSystemNotification } from '../libs/utils/system-notification.js';
import { NotificationCreateInputType } from './notification.schema.js';
import { ApiResponse } from '../libs/class/api-response.js';

//Create a new Notification
export const createNotificationController = async (req: Request, res: Response) => {
  const userID = req.params.id;
  const notificationBody = req.body as NotificationCreateInputType;

  // Individual Notification
  if (userID) {
    const notification = await sendSystemNotification({ userID, ...notificationBody });
    if (!notification) throw new ApiError(400, 'Failed To Create Notification');
    return ApiResponse.success(res, {
      message: 'Notification sent to user successfully',
      data: notification,
      statusCode: 201,
    });
  }

  //  Global Notification
  const notification = await Notification.create(notificationBody);
  if (!notification) throw new ApiError(400, 'Failed To Create Notification');
  return ApiResponse.success(res, {
    message: 'Global notification created successfully',
    data: notification,
    statusCode: 201,
  });
};

//Get the most recent Notification
export const getLatestNotificationController = async (req: Request, res: Response) => {
  const user = req.user;

  const countNotification = await Notification.countDocuments();
  if (countNotification === 0) {
    return ApiResponse.success(res, {
      message: 'There are no notification',
      data: null,
      statusCode: 200,
    });
  }

  const latestNotification = await Notification.findOne({
    $or: [{ user: user?.id }, { user: null }],
  }).sort({ createdAt: -1 });
  return ApiResponse.success(res, {
    message: 'The most recent notification is ',
    data: latestNotification,
    statusCode: 200,
  });
};

//Get all the Notification
export const getAlltNotificationController = async (req: Request, res: Response) => {
  const user = req.user;

  const countNotification = await Notification.countDocuments();
  if (countNotification === 0) {
    return ApiResponse.success(res, {
      message: 'There are no notification',
      data: null,
      statusCode: 200,
    });
  }

  const allNotification = await Notification.find({ $or: [{ user: user?.id }, { user: null }] })
    .sort({ createdAt: -1 })
    .lean();
  return ApiResponse.success(res, {
    message: 'The notifications are  ',
    data: allNotification,
    statusCode: 200,
  });
};

//Update Notification
export const updateNotificationController = async (req: Request, res: Response) => {
  const ID = req.params.id;

  //Sabse pehle Db mein existing notification dhundho
  const updatedNotification = await Notification.findByIdAndUpdate(ID, req.body, { new: true });

  if (!updatedNotification) {
    throw new ApiError(404, 'Notification not found');
  }

  return ApiResponse.success(res, {
    message: 'The notification has been updated successfully ',
    data: updatedNotification,
    statusCode: 200,
  });
};

//Delete One Notification
export const deleteNotificationController = async (req: Request, res: Response) => {
  const ID = req.params.id;

  const notification = await Notification.findByIdAndDelete(ID);

  if (!notification) {
    throw new ApiError(404, 'The notification was not found');
  }

  return ApiResponse.success(res, {
    message: 'The notification has been deleted successfully',
    data: null,
    statusCode: 200,
  });
};
