import type { Request, Response } from 'express';

import { getSessionByIdSchema, getSessionSchema } from './session.schema.js';
import { Programme } from '../../database/programmes.model.js';
import { Session } from '../../database/session.model.js';
import { Workshop } from '../../database/workshop.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, deleteCache } from '../../libs/redis/redis-utils.js';
import { convertToObjectId } from '../../libs/utils/convert-object-id.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { notification } from '../../libs/utils/notification.js';
import { sendPushToUser } from '../../libs/utils/push-notification.js';

//Add a session
export const addSession = async (req: Request, res: Response) => {
  const { programmeId } = req.params;
  const { workshopId } = req.body;

  //Checking for programme existence
  const programme = await Programme.findById(programmeId);

  if (!programme) {
    throw new ApiError(404, 'Programme not found');
  }

  //Checking for workshop existence
  if (workshopId) {
    const workshop = await Workshop.findOne({
      _id: workshopId,
      programmeId,
      isDeleted: false,
    });

    if (!workshop) {
      throw new ApiError(404, 'Workshop not found');
    }
  }

  let newWorkshopId;

  // If no workshop is provided
  if (!workshopId) {
    const workshop = await Workshop.create({
      title: req.body.title,
      description: req.body.description,
      programmeId: convertToObjectId(req.params.programmeId as string),
    });

    newWorkshopId = workshop._id;
  }

  const newSession = await Session.create({
    ...req.body,
    newWorkshopId,
  });

  const notificationTitle = 'Receieved New Session';
  const notificationDesc = `A new Session has been created`;
  await notification.specific.success(
    [newSession.speaker.toString()],
    notificationTitle,
    notificationDesc,
  );

  // await sendPushToUser(newSession.speaker.toString(), {
  //   title: 'New Session Created',
  //   body: `${newSession.title} has been scheduled`,
  // });

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

  const updatedSession = await Session.findByIdAndUpdate(
    { _id: req.params, isDeleted: false },
    updates,
  ).lean();

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
  await sendPushToUser(updatedSession.speaker.toString(), {
    title: 'New Session Created',
    body: `${updatedSession.title} has been scheduled`,
  });

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
    data: null,
    statusCode: 200,
  });
};

/*Permanent Deletion of programme
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
*/

//Get all sessions
export const getSessions = async (req: Request, res: Response) => {
  const session = await Session.find({
    workshopId: req.params.workshopId,
    isDeleted: false,
  })
    .populate('speaker')
    .lean();

  if (session.length === 0) {
    throw new ApiError(404, 'Sessions not found');
  }

  const normalized = normalizeDoc(session);
  const parsed = getSessionSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Sessions fetched successfully',
    data: parsed,
    statusCode: 200,
  });
};

//Get a single Session
export const getSingleSession = async (req: Request, res: Response) => {
  const session = await Session.findOne({
    _id: req.params.sessionId,
    workshopId: req.params.workshopId,
    isDeleted: false,
  })
    .populate('speaker')
    .lean();

  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  const normalized = normalizeDoc(session);
  const parsed = getSessionByIdSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Session fetched successfully',
    data: parsed,
    statusCode: 200,
  });
};
