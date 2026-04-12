import { Request, Response } from "express";
import { Workshop } from "../../database/workshop.model.js";
import { ApiError } from "../../libs/class/api-error.js";


//Add a workshop
export const addWorkshop = async (req: Request, res: Response) => {
  const { title, description, participantList } = req.body;

  const newWorkshop = await Workshop.create({
    title,
    description,
    participantList: participantList || [],
  });

  return res.status(201).json({
    success: true,
    message: "Workshop is added successfully.",
    data: newWorkshop,
  });
};

//Edit a workshop
export const editWorkshop = async (req: Request, res: Response) => {
  const updates: any = {};

  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.description !== undefined)
    updates.description = req.body.description;
  if (req.body.participantList !== undefined)
    updates.participantList = req.body.participantList;

  const updatedWorkshop = await Workshop.findByIdAndUpdate(
    req.params.id,
    updates,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedWorkshop) {
    throw new ApiError(404, "Workshop not found");
  }

  return res.status(200).json({
    success: true,
    message: "Workshop has been updated successfully",
    data: updatedWorkshop,
  });
};

//Delete a workshop
export const deleteWorkshop = async (req: Request, res: Response) => {
  const deleted = await Workshop.findByIdAndDelete(req.params.id);

  if (!deleted) throw new ApiError(404, "Workshop not found");

  return res.status(200).json({
    success: true,
    message: "Workshop has been deleted successfully",
    data: null,
  });
};


