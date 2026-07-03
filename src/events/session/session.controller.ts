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
    workshopId: workshopId || newWorkshopId,
    programmeId: programmeId,
  });

  const notificationTitle = 'Receieved New Session';
  const notificationDesc = `A new Session has been created`;
  await notification.specific.success(
    newSession.speaker.map((id) => id.toString()),
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

/*
//Get all sessions
export const getSessions = async (req: Request, res: Response) => {
  const session = await Session.find({
    programmeId: req.params.programmeId,
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



//Search for Session
export const getSessionByKeyword = async (req: Request, res: Response) => {
  const keyword = req.query.keyword as string;

  // Search by name, brand, or category using case-insensitive regex
  const regex = new RegExp(keyword, 'i');

  const session = await Session.find({
    $or: [{ title: { $regex: regex } }, { description: { $regex: regex } }],
  })
    .populate('speaker')
    .limit(5)
    .lean(); // Return top 5 suggestions

  if (session.length === 0) {
    return ApiResponse.success(res, {
      message: 'No sessions found',
      data: [],
      statusCode: 200,
    });
  }

  const normalized = normalizeDoc(session);
  const parsed = getSessionSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Sessions fetched successfully',
    data: parsed,
    statusCode: 200,
  });
};
*/

//Get sessions
export const getSessions = async (req: Request, res: Response) => {
  const programmeId = req.query.programmeId as string;
  const programmeTitle = req.query.programmeTitle as string;
  const workshopId = req.query.workshopId as string;
  const keyword = req.query.keyword as string;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  //Base query
  const query: any = {
    isDeleted: false,
  };

  //Filter by programmeId
  if (programmeId) {
    const programme = await Programme.findById(programmeId);

    if (!programme) {
      throw new ApiError(404, 'Programme not found');
    }

    query.programmeId = programmeId;
  }

  //Filter by programme title
  else if (programmeTitle) {
    const regex = new RegExp(programmeTitle, 'i');

    const programmes = await Programme.find({
      title: { $regex: regex },
    }).select('_id');

    //If no matching programmes exist, return empty result
    if (programmes.length === 0) {
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

    query.programmeId = {
      $in: programmes.map((programme) => programme._id),
    };
  }

  //Filter by workshop
  if (workshopId) {
    const workshop = await Workshop.findById(workshopId);

    if (!workshop) {
      throw new ApiError(404, 'Workshop not found');
    }

    query.workshopId = workshopId;
  }

  //Search session title/description
  if (keyword) {
    const regex = new RegExp(keyword, 'i');

    query.$or = [{ title: { $regex: regex } }, { description: { $regex: regex } }];
  }

  const sessions = await Session.find(query)
    .populate('speaker')
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
      keyword || programmeTitle ? 'Sessions fetched successfully' : 'Sessions fetched successfully',
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
    programmeId: req.params.programmeId,
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
