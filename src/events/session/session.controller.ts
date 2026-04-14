import { Request, Response } from "express";
import { Session } from "../../database/session.model.js";
import { ApiError } from "../../libs/class/api-error.js";
import { Workshop } from "../../database/workshop.model.js";

//Add a session
export const addSession = async (req: Request, res: Response) => {
  const { workshopId } = req.params;

  const workshop = await Workshop.findById(workshopId);
  if (!workshop) {
    throw new ApiError(404, "Workshop not found");
  }

  const newSession = await Session.create({ ...req.body, workshopId, });

  return res.status(200).json({
    success: true,
    message: "Session created successfully",
    data: newSession,
  });
};

//Edit a session
export const editSession = async (req: Request, res: Response) => {
  const updates = req.body; // ✅ already validated

  const updatedSession = await Session.findByIdAndUpdate(
    { _id: req.params.id, workshopId: req.params.workshopId },
    updates,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedSession) { throw new ApiError(404, "Session not found"); }

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
