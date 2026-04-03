import { Request, Response } from "express";
import { Attendence } from "../../database/attendence.model.js";
import { ApiError } from "../../libs/class/api-error.js";

export const todayController = async (req: Request, res: Response) => {
  const user = req.user
  const today = await Attendence.findOne({ user: user?.id, date: new Date().toLocaleDateString() }).select("-_id").lean()

  if (!today) throw new ApiError(404,"Today Attendance Not Found.")
  
  return res.status(200).json({ success: true, message: "Today Attendance.", data: today })
}
