import { Request, Response } from "express";
import { Participant } from "../../database/participant.model.js";
import { Session } from "../../database/session.model.js";
import { ApiError } from "../../libs/class/api-error.js";
import { success } from "zod";
import { Error } from "mongoose";

//Add participant
export const addParticipant = async (req: Request, res: Response) => {
    const newParticipant = await Participant.create(req.body);
    return res.status(200).json({
        success: true,
        message: "participant is added successfully.",
        data: newParticipant,
    });
};

//Read participant
export const readAllParticipant = async (req: Request, res: Response) => {
    const allParticipant = await Participant.find();
    if (allParticipant.length === 0) throw new ApiError(404, "No participant to show")
    return res.status(201).json({
        success: true,
        message: "All participant list",
        data: allParticipant
    });
}

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
