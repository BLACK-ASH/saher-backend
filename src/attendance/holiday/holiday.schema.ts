import z from "zod";
import { holidayTypes } from "../../database/holiday.model.js";
import { NextFunction, Request, Response } from "express";
import { ApiError } from "../../libs/class/api-error.js";

export const holidaySchema = z.object({
  title: z.string().min(2, "Holiday Title Is Required."),
  type: z.enum(holidayTypes).default("other"),
  date: z.date()
})

export const holidayUpdateSchema = holidaySchema.partial()

