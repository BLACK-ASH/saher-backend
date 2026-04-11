import { Request, Response } from "express";
import { SessionAttendance } from "../../database/sessionAttendance.model.js";
import { string, success } from "zod";
import { ApiError } from "../../libs/class/api-error.js";
import { Session } from "../../database/session.model.js";
import { Participant } from "../../database/participant.model.js";
import mongoose from "mongoose";

export const markAttendance = async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const { participantIds }: { participantIds: string[] } = req.body;

  if (!sessionId || !participantIds?.length) {
    throw new ApiError(400, "sessionId and participantIds are required");
  }

  const sessionExist = await Session.findById(sessionId);
  if (!sessionExist) throw new ApiError(400, "Session not found");

  const validParticipants = await Participant.find({
    _id: { $in: participantIds },
    workshopId: sessionExist.workshopId,
  }).select("_id");

  const validIds = validParticipants.map((p) => p._id.toString());

  const objectIds = validIds.map(
  id => new mongoose.Types.ObjectId(id)
);

  const invalidIds = participantIds.filter((id) => !validIds.includes(id));
  if (invalidIds.length > 0) {
    throw new ApiError(400, `Invalid participants: ${invalidIds.join(", ")}`);
  }

  await SessionAttendance.updateMany(
    {
      sessionId,
      participantId: { $in: objectIds },
    },
    {
      $set: { status: "present" },
    },
  );

  const present = await SessionAttendance.find({ sessionId }).populate(
    "participantId",
  );

  return res.status(200).json({
    success: true,
    message: "Attendance marked successfully",
    data: present,
  });
};

export const getSessionAttendance = async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    throw new ApiError(400, "sessionId is required");
  }

  const data = await SessionAttendance.find({ sessionId }).populate(
    "participantId",
  );

  return res.status(200).json({
    success: true,
    data,
  });
};
