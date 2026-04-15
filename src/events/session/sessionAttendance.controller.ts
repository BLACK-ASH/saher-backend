import { Request, Response } from "express";
import { ApiError } from "../../libs/class/api-error.js";
import { Session } from "../../database/session.model.js";
import { Workshop } from "../../database/workshop.model.js";
import { sessionAttendance } from "../../database/session.model.js";
import mongoose, { Types } from "mongoose";
import { Participant } from "../../database/participant.model.js";

export const markAttendance = async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const { participantIds } = req.body;

  if (!sessionId) {
    throw new ApiError(400, "sessionId are required");
  }

  // Get session
  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found");

  // get workshop
  const workshop = await Workshop.findById(session.workshopId);
  if (!workshop) throw new ApiError(404, "Workshop not found");

  // existing workshop participants
  const participants = workshop.participants ?? []
  console.log({ participantIds, participants })

  const paricipantsString = participants.map(id => id.toString())
  let success: Types.ObjectId[] = [], failure: Types.ObjectId[] = [];

  participantIds.forEach((participant: Types.ObjectId) => {
    if (paricipantsString.includes(participant.toString())) {
      success.push(participant)
    }
    else {
      failure.push(participant)
    }
  });

  const ParticipantsInCollection = await Participant.find({
    _id: { $in: failure },
  }).select("_id").lean();

  ParticipantsInCollection.map((e) => {
    success.push(e._id)
    failure.filter(p => e._id != p)
  })

  await Workshop.updateOne({ _id: workshop._id }, { $addToSet: { participants: { $each: success } } })

  session.participants = success
  await session.save()

  return res.status(200).json({
    success: true,
    message: "Attendance marked successfully",
    data: {
      success,
      failure,
    },
  });
};