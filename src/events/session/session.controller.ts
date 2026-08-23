import type { Request, Response } from 'express';
import { Types, type QueryFilter } from 'mongoose';
import z from 'zod';

import { sessionResponse } from './session.schema.js';
import { Program } from '../../database/program.model.js';
import { Session } from '../../database/session.model.js';
import { Workshop } from '../../database/workshop.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, deleteCache } from '../../libs/redis/redis-utils.js';
import { convertToObjectId } from '../../libs/utils/convert-object-id.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { notification } from '../../libs/utils/notification.js';
import { sendPushToUser } from '../../libs/utils/push-notification.js';
import { participantResponseSchema } from '../participant/participant.schema.js';

// Calendar month cache is keyed on session date — every writer must invalidate
const invalidateCalendarCache = async (date: Date | string) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return;
  await deleteCache(createKey('calendar', d.getFullYear(), d.getMonth()));
};

//Add a session
export const addSession = async (req: Request, res: Response) => {
  const { programId } = req.params;
  const { workshop: workshopId } = req.body;

  //Checking for program existence
  const program = await Program.findById(programId);

  if (!program) {
    throw new ApiError(404, 'Program not found');
  }

  //Checking for workshop existence
  if (workshopId) {
    const workshop = await Workshop.findOne({
      _id: workshopId,
      program: program._id,
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
      program: convertToObjectId(req.params.programId as string),
    });

    newWorkshopId = workshop._id;
  }

  const newSession = await Session.create({
    ...req.body,
    workshop: workshopId || newWorkshopId,
    program: programId,
  });

  const notificationTitle = 'New Session Assigned';
  const notificationDesc = `${newSession.title} has been assigned to you.`;
  await notification.specific.info(
    newSession.speaker.map((id) => id.toString()),
    notificationTitle,
    notificationDesc,
  );

  await Promise.allSettled(
    newSession.speaker.map((id) =>
      sendPushToUser(id.toString(), {
        title: 'New Session Assigned',
        body: `${newSession.title} has been assigned to you.`,
      }),
    ),
  );

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
    { _id: req.params.id, isDeleted: false },
    updates,
  ).lean();

  if (!updatedSession) {
    throw new ApiError(404, 'Session not found');
  }

  // Invalidate old date's month; date may have moved to another one
  await invalidateCalendarCache(updatedSession.date);
  if (updates.date && new Date(updates.date).getTime() !== new Date(updatedSession.date).getTime()) {
    await invalidateCalendarCache(updates.date);
  }

  const notificationTitle = 'Session Updated';
  const notificationDesc = `"${updatedSession.title}" has been updated. Please review the latest session details.`;
  await notification.specific.success(
    updatedSession.speaker.map((id) => id.toString()),
    notificationTitle,
    notificationDesc,
  );

  await Promise.allSettled(
    updatedSession.speaker.map((id) =>
      sendPushToUser(id.toString(), {
        title: 'Session Updated',
        body: `"${updatedSession.title}" has been updated. Tap to view the latest details.`,
      }),
    ),
  );

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

  await invalidateCalendarCache(session.date);

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

  await invalidateCalendarCache(session.date);

  return ApiResponse.success(res, {
    message: 'Session has been restored successfully',
    data: null,
    statusCode: 200,
  });
};

//Get sessions

export const getSessions = async (req: Request, res: Response) => {
  const keyword = req.query.keyword?.toString().trim();

  const isDeleted =
    req.query.isDeleted === 'true' ? true : req.query.isDeleted === 'false' ? false : false;

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  const query: QueryFilter<typeof Session.schema.obj> = {
    isDeleted,
  };

  if (keyword) {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKeyword, 'i');

    const [programs, workshops] = await Promise.all([
      Program.find({
        title: { $regex: regex },
      }).select('_id'),

      Workshop.find({
        title: { $regex: regex },
      }).select('_id'),
    ]);

    const orConditions: QueryFilter<typeof Session.schema.obj>[] = [
      { title: { $regex: regex } },
      { description: { $regex: regex } },
    ];

    if (Types.ObjectId.isValid(keyword)) {
      orConditions.push({
        programId: convertToObjectId(keyword),
      });

      orConditions.push({
        workshopId: convertToObjectId(keyword),
      });
    }

    if (programs.length > 0) {
      orConditions.push({
        programId: {
          $in: programs.map((program) => program._id),
        },
      });
    }

    if (workshops.length > 0) {
      orConditions.push({
        workshopId: {
          $in: workshops.map((workshop) => workshop._id),
        },
      });
    }

    query.$or = orConditions;
  }

  const [sessions, count] = await Promise.all([
    Session.find(query)
      .populate({
        path: 'speaker',
        populate: {
          path: 'image',
        },
      })
      .populate('program', 'title')
      .populate('workshop', 'title')
      .populate('images')
      .populate('bills')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Session.countDocuments(query),
  ]);

  const normalized = normalizeDoc(sessions);
  const parsed = z.array(sessionResponse).parse(normalized);

  return ApiResponse.success(res, {
    message: sessions.length ? 'Sessions fetched successfully' : 'No sessions found',
    data: parsed,
    statusCode: 200,
    meta: {
      page,
      limit,
      count,
      total: Math.ceil(count / limit),
    },
  });
};

//Get a single Session
export const getSingleSession = async (req: Request, res: Response) => {
  const session = await Session.findOne({
    _id: req.params.sessionId,
    isDeleted: false,
  })
    .populate({
      path: 'speaker',
      populate: {
        path: 'image',
      },
    })
    .populate({
      path: 'participants',
      populate: {
        path: 'image document',
      },
    })
    .populate('program', 'title')
    .populate('workshop', 'title')
    .populate('images')
    .populate('bills')

    .lean();

  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  const normalized = normalizeDoc(session);
  const parsed = sessionResponse
    .extend({
      participants: participantResponseSchema.array().optional(),
      review: z.string().optional(),
    })
    .parse(normalized);

  return ApiResponse.success(res, {
    message: 'Session fetched successfully',
    data: parsed,
    statusCode: 200,
  });
};
