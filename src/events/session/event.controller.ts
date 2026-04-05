import { Request, Response } from "express";
import { Session } from "../../database/event.model.js";
import { ApiError } from "../../libs/class/api-error.js";
import { success } from "zod";

//Add a session
export const addSession = async (req: Request, res: Response) => {
  const newSession = await Session.create(req.body);
  if (!newSession) throw new ApiError(500, "Failed to add a Session");
  return res.status(200).json({
    success: true,
    message: "Session is added successfully.",
    data: newSession
  });
};

//Delete a session
export const deleteSession = async (req: Request, res: Response) => {
  const id = req.params.id;
  const deleted = await Session.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(500, "Failed to delete a Session")
  return res.status(200).json({
    success: true,
    message: "Session has been deleted successfully",
    data: null
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
    return res.status(500).json({
      success: true,
      message: "Session Updated successfully",
      data: updatedSession
    });
    // res.status(500).json({ error: "Failed to update session" });
};
