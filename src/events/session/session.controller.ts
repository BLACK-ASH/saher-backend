import type { Request, Response } from 'express';

import { createSessionResponseSchema } from './session.schema.js';
import { Session } from '../../database/session.model.js';
import { Workshop } from '../../database/workshop.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, deleteCache } from '../../libs/redis/redis-utils.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { notification } from '../../libs/utils/notification.js';
import { sendPushToUser } from '../../libs/utils/push-notification.js';

//Add a session
export const addSession = async (req: Request, res: Response) => {
  const { workshopId } = req.params;
  if (!workshopId) throw new ApiError(400, 'Id is required in params');

  const workshop = await Workshop.findById(workshopId);
  if (!workshop) {
    throw new ApiError(404, 'Workshop not found');
  }

  const newSession = await Session.create({ ...req.body, workshopId });

  const notificationTitle = 'Receieved New Session';
  const notificationDesc = `A new Session has been created`;
  await notification.specific.success(
    [newSession.speaker.toString()],
    notificationTitle,
    notificationDesc,
  );
  await Promise.all(
    newSession.speaker.map((speakerId) =>
      sendPushToUser(speakerId.toString(), {
        title: 'New Session Created',
        body: `${newSession.title} has been scheduled`,
      }),
    ),
  );

  const normalized = normalizeDoc(newSession.toObject());
  const parsed = createSessionResponseSchema.parse(normalized);

  const date = req.body.date;
  const month = new Date(date).getMonth();
  const year = new Date(date).getFullYear();
  const key = createKey('calendar', year, month);

  await deleteCache(key);

  return ApiResponse.success(res, {
    message: 'Session created successfully',
    data: null,
    statusCode: 200,
  });
};

//Edit a session
export const editSession = async (req: Request, res: Response) => {
  const updates = req.body;
  const { sessionId } = req.params;
  if (!sessionId) throw new ApiError(400, 'Id is required in params');

  const updatedSession = await Session.findByIdAndUpdate(sessionId, updates).lean();

  if (!updatedSession) {
    throw new ApiError(404, 'Session not found');
  }

  const notificationTitle = 'Receieved Updated Session';
  const notificationDesc = `A Session has been Updated`;
  await notification.specific.success(
    [updatedSession.speaker.toString()],
    notificationTitle,
    notificationDesc,
  );
  await Promise.all(
    updatedSession.speaker.map((speakerId) =>
      sendPushToUser(speakerId.toString(), {
        title: 'New Session Created',
        body: `${updatedSession.title} has been scheduled`,
      }),
    ),
  );

  const normalized = normalizeDoc(updatedSession);
  const parsed = createSessionResponseSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Session has been Updated successfully',
    data: null,
    statusCode: 200,
  });
};

// soft delete a session
export const deleteSession = async (req: Request, res: Response) => {
  const session = await Session.findOne({ _id: req.params.id, isDeleted: false });
  if (!session) throw new ApiError(404, 'Session not found');
  session.isDeleted = true;
  await session.save();
  return ApiResponse.success(res, {
    message: 'Session has been deleted successfully',
    data: null,
    statusCode: 200,
  });
};

//Undo delete (only works if the session is soft-deleted)
export const undoDeleteSession = async (req: Request, res: Response) => {
  const session = await Session.findOne({
    _id: req.params.id,
    isDeleted: true,
  });

  if (!session) {
    throw new ApiError(404, 'Deleted Session not found');
  }

  session.isDeleted = false;

  await session.save();

  return ApiResponse.success(res, {
    message: 'Session has been restored successfully',
    data: session,
    statusCode: 200,
  });
};

//Permanent Deletion of programme
export const permanentDeleteSession = async (req: Request, res: Response) => {
  const session = await Session.findOne({
    _id: req.params.id,
    isDeleted: true,
  });

  if (!session) {
    throw new ApiError(404, 'Session must be soft deleted before permanent deletion');
  }

  await Session.findByIdAndDelete(req.params.id);

  return ApiResponse.success(res, {
    message: 'Session has been permanently deleted',
    data: null,
    statusCode: 200,
  });
};
