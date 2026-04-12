import { Request, Response } from "express";
import { SessionAttendance } from "../../database/sessionAttendance.model.js";
import { string, success } from "zod";
import { ApiError } from "../../libs/class/api-error.js";
import { Workshop } from "../../database/workshop.model.js";
import { Session } from "../../database/session.model.js";
import { Participant } from "../../database/participant.model.js";
import { AnyBulkWriteOperation } from "mongoose";
import mongoose from "mongoose";

export const markAttendance = async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const { participantIds }: { participantIds: string[] } = req.body;


  if (!sessionId || !Array.isArray(participantIds) || participantIds.length === 0) {
    throw new ApiError(400, "sessionId and participantIds are required");
  }

  // Invalid Id 
  const invalidIds = participantIds.filter((id) => {
    !mongoose.Types.ObjectId.isValid(id);
  })
  if (invalidIds) throw new ApiError(400, "Invalid Participant IDs")

  // get session
  const sessionExist = await Session.findById(sessionId);
  if (!sessionExist) throw new ApiError(400, "Session not found");

  // get workshop
  const workshop = await Workshop.findById(sessionExist.workshopId);
  if (!workshop) throw new ApiError(404, "Workshop not found");

  // convert ids
  const convertIds = participantIds.map(
    id => new mongoose.Types.ObjectId(id)
  );

  // existing participants in workshop list
  const existingSet = new Set(
    workshop.participantList.map((id: mongoose.Types.ObjectId) =>
      id.toString()
    )
  );

  // finding new participants
  const newParticipants = convertIds.filter((id) => !existingSet.has(id.toString()));

  // add missing participants to workshop
  if (newParticipants.length > 0) {
    await Workshop.updateOne(
      { _id: workshop._id },
      {
        $addToSet: {
          participantList: { $each: newParticipants },
        },
      }
    );
  }

  // bulk attendance update
  const bulkOps: AnyBulkWriteOperation<any>[] = convertIds.map((participantId) => ({
    updateOne: {
      filter: { sessionId, participantId },
      update: { $set: { status: "present" } },
      upsert: true, // creates if not exists
    },
  }));

  // Execute bulk update
  await SessionAttendance.bulkWrite(bulkOps);

  // storing the present participants of session
  const present = await SessionAttendance.find({ sessionId }).populate("participantId",);

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
