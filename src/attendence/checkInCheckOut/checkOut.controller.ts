import { Request, Response } from "express"
import { User } from "../../database/user.model.js"
import { Attendence } from "../../database/attendence.model.js"

export const checkOutController = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?.id)

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false
      })
    }


    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const currentTime = new Date()

    const userAttendence = await Attendence.findOne({
      user: user._id,
      inTime: { $gte: today }
    })

    if (!userAttendence) {
      return res.status(400).json({
        message: "You have not checked in today",
        success: false
      })
    }

    if (userAttendence.outTime) {
      return res.status(400).json({
        message: "You have already checked out",
        success: false
      })
    }

    // ✔ set checkout time
    userAttendence.outTime = currentTime
    await userAttendence.save()

    return res.status(200).json({
      message: "Checked out successfully",
      success: true
    })

  } catch (error) {
    console.error(error)

    return res.status(500).json({
      message: "Internal server error",
      success: false
    })
  }
}