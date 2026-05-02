import { Request, Response } from 'express';
import { ApiError } from '../libs/class/api-error.js';
import { Notification } from '../database/notification.model.js';
import { sendNotification, SendNotificationSchema } from '../libs/utils/system-notification.js';
// import { NotificationCreateInputType, notificationResponseSchema } from './notification.schema.js';
import { ApiResponse } from '../libs/class/api-response.js';
import { normalizeDoc } from '../libs/utils/normailize-doc.js';
import { notificationResponseListSchema, notificationResponseSchema } from './notification.schema.js';


//Create a new Notification
export const createNotificationController = async (req: Request, res: Response) => {

  const parsed = SendNotificationSchema.parse(req.body)

  await sendNotification(parsed);

  return ApiResponse.success(res, {
    statusCode : 201 ,
    message: 'Notification created successfully',
    data : null,
  });
}


//Get the most recent Notification
export const getLatestNotificationController = async (req: Request, res: Response) => {
  
  const user = req.user;
  const role = user?.role 

  // const countNotification = await Notification.countDocuments();
  // if (countNotification === 0) {
  //   return ApiResponse.success(res, {
  //     message: 'There are no notification',
  //     data: null,
  //     statusCode: 200,
  //   });
  // }

  const latestNotification = await Notification.findOne({
    $or: [{ user: user?.id }, { scope : role },{scope : "global"}],
  }).sort({ createdAt: -1 }).lean();

 if (!latestNotification) {
  return ApiResponse.success(res, {
    message: 'There are no notifications',
    data: null,
    statusCode: 200,
  });
}

  const normalized = normalizeDoc(latestNotification)
  const parsed = notificationResponseSchema.parse(normalized)
  return ApiResponse.success(res, {
    message: 'The most recent notification is ',
    data: parsed ,
    statusCode: 200,
  });
};

//Get all the Notification
export const getAlltNotificationController = async (req: Request, res: Response) => {
  const user = req.user;
  const role = user?.role 

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // const countNotification = await Notification.countDocuments();
  // if (countNotification === 0) {
  //   return ApiResponse.success(res, {
  //     message: 'There are no notification',
  //     data: null,
  //     statusCode: 200,
  //   });
  // }

  const allNotification = await Notification.find({ $or: [{ user: user?.id }, { scope : role } , {scope : 'global'}] })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const count = await Notification.countDocuments({ $or: [{ user: user?.id }, { scope : role } , {scope : 'global'}] })
  const normalized = normalizeDoc(allNotification)
  const parsed = notificationResponseListSchema.parse(normalized)
  return ApiResponse.success(res, {
    message: 'The notifications are  ',
    data: parsed ,
    statusCode: 200,
    meta: { page, limit, count, totalPages: Math.ceil(count / limit) },
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

  const normalized = normalizeDoc(updatedNotification)
  const parsed = notificationResponseSchema.parse(normalized)


  return ApiResponse.success(res, {
    message: 'The notification has been updated successfully ',
    data: parsed ,
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
