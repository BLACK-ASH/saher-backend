import z from "zod" 
import { NextFunction, Request, Response } from "express";

export const attendanceCorrectionSchema = z.object({
    reason : z.string(),
    inTime: z.coerce.date(),
    outTime:z.coerce.date(),
    dateForCorrection:z.coerce.date(),
    demandsToBe:z.enum(["present","absent","halfday"]),
    isLate:z.boolean(),
    // status:z.enum(["Approved","Rejected","Hold"])
})


export type AttendanceCorrectionUpdate = z.infer<typeof attendanceCorrectionSchema>
// attendenceCorrectionSchema = attendenceCorrectionSchema.partial()


export const validateAttendanceCorrection = async (req: Request, res: Response, next: NextFunction) => {
  const parsedUpdateAttendanceCorrection = await attendanceCorrectionSchema.safeParseAsync(req.body)

  if (!parsedUpdateAttendanceCorrection.success) {
    return res.status(400).json({ success: false, message: "Invalid Input" + parsedUpdateAttendanceCorrection.error.issues[0].message, data: parsedUpdateAttendanceCorrection.error.issues[0] })
  }

  req.body = parsedUpdateAttendanceCorrection.data
  next()
}

