import { NextFunction, Request, Response } from "express";
import z from "zod";
import { ApiError } from "../../libs/class/api-error.js";
import { attendanceRequestStatus } from "../../database/attendance-correction.model.js";
import { attendanceStatus } from "../../database/attendance.model.js";

const attendanceCorrectionSchema = z.object({
  attendanceId: z.string(),
  message: z.string(),
  inTime: z.union([z.string().datetime(), z.date()]).transform((val) => new Date(val)).optional(),
  outTime: z.union([z.string().datetime(), z.date()]).transform((val) => new Date(val)).optional(),
  isLate: z.boolean().optional(),
  status: z.enum(attendanceStatus).optional(),
  proof: z.string().optional()
})

const attendanceCorrectionUpdateSchema = attendanceCorrectionSchema.omit({ attendanceId: true, message: true, proof: true })
  .extend({
    "request-status": z.enum(attendanceRequestStatus),
    reason: z.string().min(3),
    id: z.string()
  })

export const attendanceRecordSchema = attendanceCorrectionSchema.omit({ attendanceId: true, message: true, proof: true })
export type AttendanceCorrectionInputType = z.infer<typeof attendanceCorrectionSchema>
export type AttendanceCorrectionUpdateInputType = z.infer<typeof attendanceCorrectionUpdateSchema>

export const validateAttendanceCorrectionCreate = (req: Request, res: Response, next: NextFunction) => {
  const parsedAttendanceCorrectionInput = attendanceCorrectionSchema.safeParse(req.body)

  const message = "Invalid Input - " + parsedAttendanceCorrectionInput.error?.message
  if (!parsedAttendanceCorrectionInput.success) throw new ApiError(400, message, parsedAttendanceCorrectionInput.error?.issues[0].message)

  req.body = parsedAttendanceCorrectionInput.data
  next()
}

export const validateAttendanceCorrectionUpdate = (req: Request, res: Response, next: NextFunction) => {
  const parsedAttendanceCorrectionInput = attendanceCorrectionUpdateSchema.safeParse(req.body)

  const message = "Invalid Input - " + parsedAttendanceCorrectionInput.error?.issues[0].message
  console.error(parsedAttendanceCorrectionInput.error)
  if (!parsedAttendanceCorrectionInput.success) throw new ApiError(400, message, parsedAttendanceCorrectionInput.error?.issues[0].message)

  req.body = parsedAttendanceCorrectionInput.data
  next()
}
