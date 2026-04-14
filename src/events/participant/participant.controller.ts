import { Request, Response } from "express";
import { Participant } from "../../database/participant.model.js";
import { ApiError } from "../../libs/class/api-error.js";

//Add participant
export const addParticipant = async (req: Request, res: Response) => {
  const body = req.body;

  const newParticipant = await Participant.create({
    name: body.name,
    age: body.age,
    gender: body.gender,
  });

  return res.status(200).json({
    success: true,
    message: "Participant added successfully",
    data: newParticipant,
  });
};

//Read participant
export const readAllParticipant = async (req: Request, res: Response) => {
  const participants = await Participant.find({ isDeleted: false });

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
  const participant = await Participant.findById(req.params.id);

  if (!participant) {
    throw new ApiError(404, "Participant not found");
  }

  participant.isDeleted = true;
  await participant.save();

  return res.status(200).json({
    success: true,
    message: "Participant has been soft deleted successfully",
    data: null,
  });
};