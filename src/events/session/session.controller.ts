import type { Request, Response } from 'express';
import type { QueryFilter } from 'mongoose';

import { getSessionByIdSchema, getSessionSchema } from './session.schema.js';
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

//Add a session
export const addSession = async (req: Request, res: Response) => {
  const { programId } = req.params;
  const { workshopId } = req.body;

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

//Get sessions
export const getSessions = async (req: Request, res: Response) => {
  const programId = req.query.program as string;
  const programTitle = req.query.programTitle as string;
  const workshopId = req.query.workshop as string;
  const keyword = req.query.keyword as string;
  const isDeleted = (req.query.isDeleted as unknown as boolean) || false;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  //Base query
  const query: QueryFilter<typeof Session.schema.obj> = {};

  query.isDeleted = isDeleted;

  //Filter by programId
  if (programId) {
    const program = await Program.findById(programId);

    if (!program) {
      throw new ApiError(404, 'Program not found');
    }

    query.program = program;
  }

  //Filter by program title
  else if (programTitle) {
    const regex = new RegExp(programTitle, 'i');

    const programs = await Program.find({
      title: { $regex: regex },
    }).select('_id');

    //If no matching programs exist, return empty result
    if (programs.length === 0) {
      return ApiResponse.success(res, {
        message: 'No sessions found',
        data: [],
        statusCode: 200,
        meta: {
          page,
          limit,
          count: 0,
          total: 0,
        },
      });
    }

    query.program = {
      $in: programs.map((program) => program._id),
    };
  }

  //Filter by workshop
  if (workshopId) {
    const workshop = await Workshop.findById(workshopId);

    if (!workshop) {
      throw new ApiError(404, 'Workshop not found');
    }

    query.workshop = workshop;
  }

  //Search session title/description
  if (keyword) {
    const regex = new RegExp(keyword, 'i');

    query.$or = [{ title: { $regex: regex } }, { description: { $regex: regex } }];
  }

  const sessions = await Session.find(query)
    .populate({
      path: 'speaker',
      populate: {
        path: 'image',
      },
    })
    .populate('images')
    .populate('review')
    .populate('program', 'title')
    .populate('workshop', 'title')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const count = await Session.countDocuments(query);

  if (sessions.length === 0) {
    return ApiResponse.success(res, {
      message: 'No sessions found',
      data: [],
      statusCode: 200,
      meta: {
        page,
        limit,
        count: 0,
        total: 0,
      },
    });
  }

  const normalized = normalizeDoc(sessions);
  const parsed = getSessionSchema.parse(normalized);

  return ApiResponse.success(res, {
    message:
      keyword || programTitle ? 'Sessions fetched successfully' : 'Sessions fetched successfully',
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
    _id: req.params.session,
    isDeleted: false,
  })
    .populate({
      path: 'speaker',
      populate: {
        path: 'image',
      },
    })
    .populate('images')
    .populate('review')
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
