import type { Request, Response } from 'express';

import { Session } from '../../database/session.model.js';
import { Workshop } from '../../database/workshop.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, deleteCache } from '../../libs/redis/redis-utils.js';

//Add a session
export const addSession = async (req: Request, res: Response) => {
  const { workshopId } = req.params;

  const workshop = await Workshop.findById(workshopId);
  if (!workshop) {
    throw new ApiError(404, 'Workshop not found');
  }

  const newSession = await Session.create({ ...req.body, workshopId });

  const date = req.body.date;
  const month = new Date(date).getMonth();
  const year = new Date(date).getFullYear();
  const key = createKey('calendar', year, month);

  await deleteCache(key);

  return ApiResponse.success(res, {
    message: 'Session created successfully',
    data: newSession,
    statusCode: 200,
  });
};

//Edit a session
export const editSession = async (req: Request, res: Response) => {
  const updates = req.body; // ✅ already validated

  const updatedSession = await Session.findByIdAndUpdate(
    { _id: req.params.id, workshopId: req.params.workshopId },
    updates,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedSession) {
    throw new ApiError(404, 'Session not found');
  }

  return ApiResponse.success(res, {
    message: 'Session has been Updated successfully',
    data: updatedSession,
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

//Get all sessions
export const getSessions = async (req: Request, res: Response) => {
  const session = await Session.find({
    workshopId: req.params.workshopId,
    isDeleted: false,
  });

  if (session.length === 0) {
    throw new ApiError(404, 'Sessions not found');
  }

  return ApiResponse.success(res, {
    message: 'Sessions fetched successfully',
    data: session,
    statusCode: 200,
  });
};

//Get a single Session
export const getSingleSession = async (req: Request, res: Response) => {
  const session = await Session.findOne({
    _id: req.params.sessionId,
    workshopId: req.params.workshopId,
    isDeleted: false,
  });

  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  return ApiResponse.success(res, {
    message: 'Session fetched successfully',
    data: session,
    statusCode: 200,
  });
};
