import { Request, Response } from "express";
import { Participant } from "../../database/participant.model.js";
import { SessionAttendance } from "../../database/sessionAttendance.model.js";
import { Session } from "../../database/session.model.js";
import { ApiError } from "../../libs/class/api-error.js";
import { success } from "zod";

//Add a session
export const addSession = async (req: Request, res: Response) => {
  const { workshopId } = req.body;


  if (!workshopId) {
    throw new ApiError(400, "workshopId is required");
  }

  const newSession = await Session.create(req.body);

  if (!newSession) {
    throw new ApiError(500, "Failed to add a Session");
  }

  const participants = await Participant.find({ workshopId });

  await SessionAttendance.insertMany(
    participants.map((p) => ({
      sessionId: newSession._id,
      participantId: p._id,
      status: "absent",
    }))
  );

  return res.status(200).json({
    success: true,
    message: "Session created successfully",
    data: newSession,
  });
};

//Edit a session
export const editSession = async (req: Request, res: Response) => {
  const updatedSession = await Session.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updatedSession) {
    return res.status(404).json({ error: "Session not found" });
  }
  return res.status(200).json({
    success: true,
    message: "Session has been Updated successfully",
    data: updatedSession,
  });
};


//Delete a session
export const deleteSession = async (req: Request, res: Response) => {
  const id = req.params.id;
  const deleted = await Session.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "Session not found");
  return res.status(200).json({
    success: true,
    message: "Session has been deleted successfully",
    data: null,
  });
};

