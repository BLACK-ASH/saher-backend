import z from "zod";
import { holidayTypes } from "../../database/holiday.model.js";
import { NextFunction, Request, Response } from "express";
import { ApiError } from "../../libs/class/api-error.js";

const holidaySchema = z.object({
  title: z.string().min(2, "Holiday Title Is Required."),
  type: z.enum(holidayTypes).default("other"),
  date: z.date()
})

const holidayUpdateSchema = holidaySchema.partial()

export const validateHolidayCreate = (req: Request, res: Response, next: NextFunction) => {
  const parsedHolidayCreateInput = holidaySchema.safeParse(req.body)

  const message = "Invalid Input - " + parsedHolidayCreateInput.error?.issues[0].message
  if (!parsedHolidayCreateInput.success) throw new ApiError(400, message, parsedHolidayCreateInput.error?.issues[0].message)

  req.body = parsedHolidayCreateInput.data
  next()
}

export const validateHolidayUpdate = (req: Request, res: Response, next: NextFunction) => {
  const parsedHolidayUpdateInput = holidayUpdateSchema.safeParse(req.body)

  const message = "Invalid Input - " + parsedHolidayUpdateInput.error?.issues[0].message
  if (!parsedHolidayUpdateInput.success) throw new ApiError(400, message, parsedHolidayUpdateInput.error?.issues[0].message)

  req.body = parsedHolidayUpdateInput.data
  next()
}
