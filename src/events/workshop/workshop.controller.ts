import { Request, Response } from "express";
import { Workshop } from "../../database/workshop.model.js";
import { ApiError } from "../../libs/class/api-error.js";
import { success } from "zod";

//Add a workshop
export const addWorkshop = async (req: Request, res: Response) => {
  const newWorkshop = await Workshop.create(req.body);
  if (!newWorkshop) throw new ApiError(500, "Failed to add a Workshop");
  return res.status(200).json({
    success: true,
    message: "workshop is added successfully.",
    data: newWorkshop
  });
};

//Delete a workshop
export const deleteWorkshop = async (req: Request, res: Response) => {
  const id = req.params.id;
  const deleted = await Workshop.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(500, "Failed to delete a workshop")
  return res.status(200).json({
    success: true,
    message: "workshop has been deleted successfully",
    data: null
  });
};

//Edit a workshop
export const editWorkshop = async (req: Request, res: Response) => {
  
    const updatedWorkshop = await Workshop.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );
    if (!updatedWorkshop) {
      return res.status(404).json({ error: "workshop not found" });
    }
    return res.status(500).json({
      success: true,
      message: "workshop Updated successfully",
      data: updatedWorkshop
    });
    // res.status(500).json({ error: "Failed to update workshop" });
};
