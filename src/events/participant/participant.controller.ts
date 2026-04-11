import { Request, Response } from "express";
import { Participant } from "../../database/participant.model.js";
import { Session } from "../../database/session.model.js";
import { ApiError } from "../../libs/class/api-error.js";
import { success } from "zod";
import { Error } from "mongoose";

//Add participant
export const addParticipant = async (req: Request, res: Response) => {
  const { name, age, gender, workshopId } = req.body;

  if (!workshopId) {
    throw new ApiError(400, "workshopId is required");
  }

  const newParticipant = await Participant.create({
    name,
    age,
    gender,
    workshopId,
  });

  return res.status(200).json({
    success: true,
    message: "Participant added successfully",
    data: newParticipant,
  });
};

//Read participant
export const readAllParticipant = async (req: Request, res: Response) => {
  const { workshopId } = req.params;

  if (!workshopId) {
    throw new ApiError(400, "workshopId is required");
  }

  const participants = await Participant.find({ workshopId });

  return res.status(200).json({
    success: true,
    data: participants,
  });
};

//Edit Participant
export const editParticipant = async (req: Request, res: Response) => {
    const updatedParticipant = await Participant.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true,
        },
    );
    if (!updatedParticipant) {
        return res.status(404).json({ error: "Participant not found" });
    }
    return res.status(200).json({
        success: true,
        message: "Participant has been Updated successfully",
        data: updatedParticipant,
    });
};

//Delete participant
export const deleteParticipant = async (req: Request, res: Response) => {
    const id = req.params.id;
    const deleted = await Participant.findByIdAndDelete(id);
    if (!deleted) throw new ApiError(404, "Participant not found");
    return res.status(200).json({
        success: true,
        message: "Participant has been deleted successfully",
        data: null,
    });
};
