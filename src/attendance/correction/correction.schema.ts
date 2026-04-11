import { Types } from "mongoose";
import z from "zod";
import { attendanceRequestStatus } from "../../database/attendance-correction.model.js";
import { attendanceStatus } from "../../database/attendance.model.js";

export const objectId = z.string().refine(val => Types.ObjectId.isValid(val), {
  message: "Invalid ID"
})

const dateField = z.union([z.string(), z.date(), z.null()])
  .transform((val) => {
    if (val === null || val === undefined) return null;
    return new Date(val);
  });

export const attendanceCorrectionSchema = z.object({
  attendanceId: objectId,
  message: z.string().min(3).max(300),
  inTime: dateField,
  outTime: dateField,
  isLate: z.boolean().optional(),
  status: z.enum(attendanceStatus).optional(),
  proof: z.string().optional()
})

export const attendanceCorrectionUpdateSchema = attendanceCorrectionSchema.omit({ attendanceId: true, message: true, proof: true })
  .extend({
    "request-status": z.enum(attendanceRequestStatus),
    reason: z.string().min(3).max(300),
    id: objectId
  })

export const attendanceRecordSchema = attendanceCorrectionSchema.omit({ attendanceId: true, message: true, proof: true })
export type AttendanceCorrectionInputType = z.infer<typeof attendanceCorrectionSchema>
export type AttendanceCorrectionUpdateInputType = z.infer<typeof attendanceCorrectionUpdateSchema>
