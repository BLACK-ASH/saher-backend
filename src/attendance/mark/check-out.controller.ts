import { Request, Response } from "express"
import { Attendance } from "../../database/attendance.model.js"
import { ApiError } from "../../libs/class/api-error.js";
import { timeDifference } from "../../libs/utils/time-difference.js";
import { standardDateString } from "../../libs/utils/standard-date.js";


export const checkOutController = async (req: Request, res: Response) => {
  const user = req.user
  const now = new Date()

  const attendance = await Attendance.findOne({
    user: user?.id,
    date: standardDateString(now),
    inTime: { $ne: null }
  })

  //  If User Is Not Check In
  if (!attendance) throw new ApiError(400, "You Have Not Checked Out Today.")
  // If User Is Already Check Out
  if (attendance?.outTime) throw new ApiError(400, "You Have Already Checked Out Today")

  // Calculate The Work Hour And Status
  const employeeDetails = { fullTime: { fullWorkHours: 9, halfWorkHours: 4.5, graceHours: 1 }, partTime: { fullWorkHours: 4, halfWorkHours: 2, graceHours: 0.5 } }

  const final = req.user?.employeeType === "full-time" ? employeeDetails.fullTime : employeeDetails.partTime

  const workHours = Number(timeDifference(attendance.inTime as Date, now).hours.toFixed(3))
  if (!workHours) throw new ApiError(400, "Work Hours Is Not Valid.")
  const status = workHours === 0 ? "absent" : workHours > (final.fullWorkHours - final.graceHours) ? "present" : "half-day"

  attendance.outTime = now
  attendance.status = status
  attendance.workHours = workHours

  await attendance.save()

  return res.status(200).json({
    message: "Checked out successfully",
    success: true,
    data: attendance
  })

}
