import { Request, Response } from "express";
import { ApiError } from "../../libs/class/api-error.js";
import { Session } from "../../database/session.model.js";
import { Workshop } from "../../database/workshop.model.js";
import { sessionAttendance } from "../../database/session.model.js";
import { AnyBulkWriteOperation } from "mongoose"; 
import mongoose from "mongoose";

export const markAttendance = async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const { participantIds }: { participantIds: string[] } = req.body;

  if (!sessionId || !Array.isArray(participantIds) || participantIds.length === 0) {
    throw new ApiError(400, "sessionId and participantIds are required");
  }

  // Validate IDs
  const invalidIds = participantIds.filter(
    (id) => !mongoose.Types.ObjectId.isValid(id)
  );
  if (invalidIds.length > 0) {
    throw new ApiError(400, "Invalid Participant IDs");
  }

  
  // Get session
  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found");
  
  // ✅ get workshop
  const workshop = await Workshop.findById(session.workshopId); 
  if (!workshop) throw new ApiError(404, "Workshop not found");

  // Convert IDs
  const objectIds = participantIds.map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  // ✅ existing participants in workshop list
  const existingSet = new Set(
    workshop.participantList.map((id: mongoose.Types.ObjectId) =>
      id.toString()
    )
  );

  // ✅ find new participants
  const newParticipantIds = objectIds.filter(
    (id) => !existingSet.has(id.toString())
  );

  // ✅ ADD missing participants to workshop
  if (newParticipantIds.length > 0) {
    await Workshop.updateOne(
      { _id: workshop._id },
      {
        $addToSet: {
          participantList: { $each: newParticipantIds }, 
        },
      }
    );
  }

  // ✅ bulk attendance update
  const bulkOps: AnyBulkWriteOperation<any>[] = objectIds.map((participantId) => ({
    updateOne: {
      filter: { sessionId, participantId },
      update: { $set: { status: "present" } },
      upsert: true,
    },
  }));

  await sessionAttendance.bulkWrite(bulkOps);

  return res.status(200).json({
    success: true,
    message: "Attendance marked successfully",
    data: session.attendance,
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
    data: session.attendance,
  });
};