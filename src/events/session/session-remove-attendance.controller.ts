import type { Request, Response } from 'express';
import type { Types } from 'mongoose';

import { Session } from '../../database/session.model.js';
import { Workshop } from '../../database/workshop.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

export const removeAttendance = async (req: Request, res: Response) => {
  // write a code to delete and participants attendance from the session Attendance
  // step 1 : taking an sessionID from params and participantsID from req.body
  // step 2 : check whether the session id is given if given it's exist or not
  // step 3 : check whether the workshop id is given if given it's exist or not
  // step 4 : now check whether the given participantsID is exist in session attendance or not
  // // if exist then remove it from session attendance if not throw error

  const sessionId = req.params.sessionId as string;
  const { participantIds } = req.body;

  // If session is not given in params
  if (!sessionId) throw new ApiError(400, 'Session are requried');

  const session = await Session.findById(sessionId);
  // If session is not Exist
  if (!session) throw new ApiError(404, 'Session not exist');

  const workshop = await Workshop.findById(session.workshop);
  // If workshop Does not exist
  if (!workshop) throw new ApiError(404, 'Workshop does not exist');

  const existInSession = session.participants;
  const sessionString = existInSession.map((e) => e.toString());
  const remove: Types.ObjectId[] = [];

  participantIds.forEach((e: Types.ObjectId) => {
    if (sessionString.includes(e.toString())) {
      remove.push(e);
    } else {
      throw new ApiError(404, 'Session participants does not match the given participants');
    }
  });

  await Session.updateOne({ _id: session._id }, { $pull: { participants: { $in: remove } } });

  return ApiResponse.success(res, {
    message: 'Participants remove from attendance Successfully',
    data: null,
    statusCode: 200,
  });
};
