import { Request, Response } from "express";
import { ApiError } from "../../libs/class/api-error.js";
import { Session } from "../../database/session.model.js";
import { Workshop } from "../../database/workshop.model.js";
import { sessionAttendance } from "../../database/session.model.js";
import mongoose from "mongoose";
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

  const participants = new Set(workshop.participants.map((id) => id.toString()));

  const success = participantIds.filter((id: mongoose.Types.ObjectId) => participants.has(id.toString()));

  const failure = participantIds.filter((id: mongoose.Types.ObjectId) => !participants.has(id.toString()));

  const ParticipantsInCollection = await Participant.find({
    _id: { $in: failure },
  }).select("_id");

  const dbSet = new Set(
    ParticipantsInCollection.map((p) => p._id.toString())
  );

  const validFailure = failure.filter((id: mongoose.Types.ObjectId) =>
    dbSet.has(id.toString())
  );

  if (validFailure.lenght > 0) {
    await Workshop.updateOne(
      { _id: workshop._id },
      {
        $addToSet: { $each: validFailure }
      }
    )
  }

  const finalSuccess = [...success, ...validFailure];

  await sessionAttendance.bulkWrite(finalSuccess);

  return res.status(200).json({
    success: true,
    message: "Attendance marked successfully",
    data: {
      success,
      failure,
    },
  });
};

export const getSessionAttendance = async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    throw new ApiError(400, "sessionId is required");
  }

  const session = await Session.findById(sessionId)
    .populate("attendance.participant");

  if (!session) throw new ApiError(404, "Session not found");

  return res.status(200).json({
    success: true,
    data: null,
  });
};