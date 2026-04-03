import { Request, Response } from "express"
import { AttendanceCorrection } from "../../database/attendance-correction.model.js"
import { ApiError } from "../../libs/class/api-error.js"
import { Attendance } from "../../database/attendance.model.js"
import { AttendanceCorrectionInputType, AttendanceCorrectionUpdateInputType, attendanceRecordSchema } from "./correction.middleware.js"
import { timeDifference } from "../../libs/utils/time-difference.js"


export const getAttendanceCorrectionController = async (req: Request, res: Response) => {
  const user = req.user

  const requests = await AttendanceCorrection.find({
    user: user?.id
  }).populate("user", "name role").lean()

  return res.status(200).json({ success: true, message: "Attendance Correction Retrieve Successful.", data: requests })
}


export const getAllAttendanceCorrectionController = async (req: Request, res: Response) => {
  const requests = await AttendanceCorrection.find().populate("user manager", "name role").lean()
  return res.status(200).json({ success: true, message: "Attendance Correction Retrieve Successful.", data: requests })
}

export const createAttendanceCorrectionController = async (req: Request, res: Response) => {
  const user = req.user
  const input: AttendanceCorrectionInputType = req.body

  // Check If The Attendance Exist If Not Reject It
  const attendance = await Attendance.findById((input.attendanceId)).lean()
  if (!attendance) throw new ApiError(404, "User Attendance Not Found.")

  // If Already A Pending Request Of That Day
  const exist = await AttendanceCorrection.findOne({ attendance: input.attendanceId })
  if (exist && exist.status === "pending") throw new ApiError(400, "A Request Already Exist Of This Date.")

  // attendanceRecordSchema will convert the full object into require object and remove unnecessary field
  const previous = attendanceRecordSchema.safeParse(attendance)
  if (!previous.success) throw new ApiError(400, previous.error?.message)

  // Parsing Input Into Safe Object If Error Happen Reject It
  const changes = attendanceRecordSchema.safeParse(input)
  if (!changes.success) throw new ApiError(400, changes.error?.message)

  // Creating The Correction Request
  const request = await AttendanceCorrection.create({
    attendance: input.attendanceId,
    user: user?.id,
    previous: previous.data,
    changes: changes.data,
    message: input.message,
    proof: input?.proof
  })
  // If Record Creation Failed
  if (!request) throw new ApiError(400, "Attendance Correction Request Failed.")

  return res.status(200).json({ success: true, message: "Attendance Correction Request Successful.", data: request })
}

export const updateAttendanceCorrectionController = async (req: Request, res: Response) => {
  const input: AttendanceCorrectionUpdateInputType = req.body
  const user = req.user
  const changes = attendanceRecordSchema.safeParse(req.body).data

  const request = await AttendanceCorrection.findById(input.id)
  if (!request) throw new ApiError(404, "Attendance Correction Request Not Found.")

  const attendance = await Attendance.findById(request.attendance)
  if (!attendance) throw new ApiError(404, "Attendace Record Not Found.")

  const workHours = timeDifference(attendance.inTime as Date, attendance.outTime as Date).hours
  if (!workHours) throw new ApiError(400, "Work Hours Is Not Valid.")
  const status = workHours === 0 ? "absent" : workHours > 5 ? "present" : "half-day"

  const newRecord = { ...changes, status, workHours }
  console.log(newRecord)

  await request.updateOne({ manager: user?.id, changes, status: input["request-status"], reason: input.reason })
  await attendance.updateOne(newRecord)

  return res.status(200).json({ success: true, message: "Attendance Correction Updated Successful.", data: request })
}
