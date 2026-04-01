import { Request, Response } from "express"
import { Attendance } from "../../database/attendance.model.js"
import { ApiError } from "../../libs/class/api-error.js";

export const checkOutController = async (req: Request, res: Response) => {
  const user = req.user
  const now = new Date()

  const attendence = await Attendance.findOne({
    user: user?.id,
    date: now.toLocaleDateString()
  })

  // If User Is Not Check In
  if (!attendence) throw new ApiError(400, "You Have Not Checked Out Today.")
  // If User Is Already Check Out
  if (attendence?.outTime) throw new ApiError(400, "You Have Already Checked Out Today")

  //  set checkout time
  attendence.outTime = now
  await attendence.save()

  return res.status(200).json({
    message: "Checked out successfully",
    success: true,
    data: attendence
  })

}
