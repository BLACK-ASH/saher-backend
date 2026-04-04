import { Request, Response } from "express";
import { Event } from "../../database/event.model.js";
import { ApiError } from "../../libs/class/api-error.js";
import { success } from "zod";

//Add an event
export const addEvent = async (req: Request, res: Response) => {
  const newEvent = await Event.create(req.body);
  if (!newEvent) throw new ApiError(500, "Failed to add an event");
  return res.status(200).json({
    success: true,
    message: "Event added successfully.",
    data: newEvent
  });
};

//Delete an event
export const deleteEvent = async (req: Request, res: Response) => {
  const id = req.params.id;
  const deleted = await Event.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(500, "Failed to delete an Event")
  return res.status(200).json({
    success: true,
    message: "Event has been deleted successfully",
    data: null
  });
};

//Edit an event
export const editEvent = async (req: Request, res: Response) => {
  
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );
    if (!updatedEvent) {
      return res.status(404).json({ error: "Event not found" });
    }
    return res.status(500).json({
      success: true,
      message: "Event Updated successfully",
      data: updatedEvent
    });
    // res.status(500).json({ error: "Failed to update event" });
};
