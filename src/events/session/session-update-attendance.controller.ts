import { Request, Response } from 'express';
import { ApiError } from '../../libs/class/api-error.js';
import { Session } from '../../database/session.model.js';
import { Workshop } from '../../database/workshop.model.js';
import { Types } from 'mongoose';
import { Participant } from '../../database/participant.model.js';

export const updateAttendance = async (req: Request, res: Response) => {
  // write a code to edit an session Attendance
  // step 1 : take sessionId from params & participantsID from body (the participantsId will be object)
  // step 2 : check whether this participants exist in workshop
  // // If exist push them in update if not then in failure
  // step 3 : check whether failure participants exist in participants collection
  // // if yes then push them in update and remove from the failure
  // In the end update the sessionId and return the update and failure participants

  const sessionId = req.params.sessionId as string;
  const { participantIds } = req.body;

  // If session is not given in params
  if (!sessionId) throw new ApiError(400, 'Session are requried');

  const session = await Session.findById(sessionId);
  // If session is not Exist
  if (!session) throw new ApiError(404, 'Session not exist');

  const workshop = await Workshop.findById(session.workshopId);
  // If workshop Does not exist
  if (!workshop) throw new ApiError(404, 'Workshop does not exist');

  const participants = workshop.participants ?? [];

  const participantsString = participants.map((id) => id.toString());

  const update: Types.ObjectId[] = [];
  let failure: Types.ObjectId[] = [];

  participantIds.forEach((e: Types.ObjectId) => {
    if (participantsString.includes(e.toString())) {
      update.push(e);
    } else {
      failure.push(e);
    }
  });

  const inCollection = await Participant.find({ _id: { $in: failure } })
    .select('_id')
    .lean();
  const collectionString = inCollection.map((e) => e._id.toString());

  inCollection.forEach((e) => {
    update.push(e._id);
    // failure.filter(p => e._id != p)
  });
  failure = failure.filter((p) => !collectionString.includes(p.toString()));

  await Workshop.updateOne(
    { _id: workshop._id },
    { $addToSet: { participants: { $each: update } } },
  );

  await Session.updateOne({ _id: session._id }, { $addToSet: { participants: { $each: update } } });
  return res.status(200).json({
    sucess: true,
    message: 'Attendance updated successfully',
    data: {
      update,
      failure,
    },
  });
};
