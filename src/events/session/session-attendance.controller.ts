import type { Request, Response } from 'express';
import type { Types } from 'mongoose';

import { Participant } from '../../database/participant.model.js';
import { Program } from '../../database/program.model.js';
import { Session } from '../../database/session.model.js';
import { Workshop } from '../../database/workshop.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

export const markAttendance = async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const { participantIds } = req.body;

  if (!sessionId) {
    throw new ApiError(400, 'session id is required');
  }

  // Get session
  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, 'Session not found');

  const workshop = await Workshop.findById(session.workshop);
  if (!workshop) throw new ApiError(404, 'Workshop not found');

  const program = await Program.findById(workshop.program);
  if (!program) throw new ApiError(404, 'Program not found');

  const participants = program.participants ?? [];

  const paricipantsString = participants.map((id) => id.toString());
  const success: Types.ObjectId[] = [];
  let failure: Types.ObjectId[] = [];

  participantIds.forEach((participant: Types.ObjectId) => {
    if (paricipantsString.includes(participant.toString())) {
      success.push(participant);
    } else {
      failure.push(participant);
    }
  });

  const participantsInCollection = await Participant.find({
    _id: { $in: failure },
  })
    .select('_id')
    .lean();
  const collectionString = participantsInCollection.map((e) => e._id.toString());

  participantsInCollection.map((e) => {
    success.push(e._id);
    // failure.filter(p => e._id != p)
  });
  failure = failure.filter((p) => !collectionString.includes(p.toString()));

  // adding data in workshop
  await Workshop.updateOne(
    { _id: workshop._id },
    { $addToSet: { participants: { $each: success } } },
  );

  session.participants = success;
  await session.save();

  // const normalized = normalizeDoc()

  return ApiResponse.success(res, {
    message: 'Attendance marked successfully',
    data: {
      success,
      failure,
    },
    statusCode: 200,
  });
};
