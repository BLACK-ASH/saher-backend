import z from "zod" 
import { NextFunction, Request, Response } from "express";

export const attendenceCorrectionSchema = z.object({
    reason : z.string(),
    inTime: z.coerce.date(),
    outTime:z.coerce.date(),
    dateForCorrection:z.coerce.date(),
    demandsToBe:z.enum(["present","absent","halfday"]),
    isLate:z.boolean(),
    // status:z.enum(["Approved","Rejected","Hold"])
})


export type AttendenceCorrectionUpdate = z.infer<typeof attendenceCorrectionSchema>
// attendenceCorrectionSchema = attendenceCorrectionSchema.partial()


export const validateAttendenceCorrection = async (req: Request, res: Response, next: NextFunction) => {
  const parsedUpdateAttendenceCorrection = await attendenceCorrectionSchema.safeParseAsync(req.body)

  if (!parsedUpdateAttendenceCorrection.success) {
    return res.status(400).json({ success: false, message: "Invalid Input" + parsedUpdateAttendenceCorrection.error.issues[0].message, data: parsedUpdateAttendenceCorrection.error.issues[0] })
  }

  req.body = parsedUpdateAttendenceCorrection.data
  next()
}

