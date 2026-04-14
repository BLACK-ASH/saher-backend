import { Request, Response } from "express";
import { Workshop } from "../../database/workshop.model.js";
import { ApiError } from "../../libs/class/api-error.js";

// Add a workshop
export const addWorkshop = async (req: Request, res: Response) => {
  const newWorkshop = await Workshop.create(req.body);

  return res.status(201).json({
    success: true,
    message: "Workshop is added successfully.",
    data: newWorkshop,
  });
};

// Edit a workshop
export const editWorkshop = async (req: Request, res: Response) => {
  const updatedWorkshop = await Workshop.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    req.body,
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

// Soft delete a workshop
export const deleteWorkshop = async (req: Request, res: Response) => {
  const workshop = await Workshop.findOne({
    _id: req.params.id,
    isDeleted: false,
  });

  if (!workshop) {
    throw new ApiError(404, "Workshop not found");
  }

  workshop.isDeleted = true;
  await workshop.save();

  return res.status(200).json({
    success: true,
    message: "Workshop has been soft deleted successfully",
    data: null,
  });
};