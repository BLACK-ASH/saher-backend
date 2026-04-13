import { Request, Response } from "express";
import { ApiError } from "../../libs/class/api-error.js";
import { Session } from "../../database/session.model.js";
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

  // Convert IDs
  const objectIds = participantIds.map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  // Map existing attendance
  const existingMap = new Map(
  (session.attendance || []).map((a) => [
    a.participant.toString(),
    a,
  ])
);

  // Update or insert
  objectIds.forEach((id) => {
    const key = id.toString();

    if (existingMap.has(key)) {
      existingMap.get(key)!.status = "present";
    } else {
      session.attendance.push({
        participant: id,
        status: "present",
      });
    }
  });

  await session.save();

  await session.populate("attendance.participant");

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