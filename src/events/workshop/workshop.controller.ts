import { Request, Response } from "express";
import { Workshop } from "../../database/workshop.model.js";
import { ApiError } from "../../libs/class/api-error.js";


//Add a workshop
export const addWorkshop = async (req: Request, res: Response) => {
  const newWorkshop = await Workshop.create({
    title:req.body.title,
    description:req.body.description,
  });
  return res.status(200).json({
    success: true,
    message: "Workshop is added successfully.",
    data: newWorkshop,
  });
};

//Edit a workshop
export const editWorkshop = async (req: Request, res: Response) => {
  const updatedWorkshop = await Workshop.findByIdAndUpdate(
    req.params.id,
    {
     title:req.body.title,
     description:req.body.description,
    },
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updatedWorkshop) {
    return res.status(404).json({ error: "Workshop not found" });
  }
  return res.status(200).json({
    success: true,
    message: "Workshop has been Updated successfully",
    data: updatedWorkshop,
  });
};

//Delete a workshop
export const deleteWorkshop = async (req: Request, res: Response) => {
  const id = req.params.id;
  const deleted = await Workshop.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "Workshop not found");
  return res.status(200).json({
    success: true,
    message: "Workshop has been deleted successfully",
    data: null,
  });
};


