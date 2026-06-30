import type { Request, Response } from 'express';

import { Session } from '../../database/session.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { notification } from '../../libs/utils/notification.js';

export const reminderNotificationController = async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  if (!sessionId) throw new ApiError(400, 'Id is required in params');

  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(400, 'Session not found');

  const notificationTitle = 'Receieved Session Reminder';
  const notificationDesc = `A Session Reminder has been pass`;
  await notification.specific.success(
    [session.speaker.toString()],
    notificationTitle,
    notificationDesc,
  );

  return ApiResponse.success(res, {
    message: 'Reminder notification send successfully',
    data: null,
    statusCode: 201,
  });
};
