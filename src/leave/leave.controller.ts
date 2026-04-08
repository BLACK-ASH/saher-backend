import { Request, Response } from "express";
import { LeaveSchemaType } from "./leave.schema.js";
import { Leave } from "../database/leave.model.js";
import { ApiError } from "../libs/class/api-error.js";

export const applyLeaveController = async (
  req: Request,
  res: Response,
) => {
  const parsedInput = req.body as LeaveSchemaType

  const user = req.user

  if (new Date(parsedInput.date) < new Date()) throw new ApiError(400,"Cannot Appy For Past Date.")

  const leave = await Leave.create({ user: user?.id, ...parsedInput })

  return res.status(200).json({
    success: true,
    message: "Leave applied successfully",
    data: leave,
  });
};
