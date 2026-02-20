import { Request, Response } from "express"
import { User } from "../../database/user.model.js"
import { success } from "zod"
import { Attendence } from "../../database/attendence.model.js"

export const checkOutController = async (req: Request, res: Response) => {
    const { email } = req.body
    const today = new Date
    today.setHours(0,0,0,0)
    const currentTime = new Date
    const existUser = await User.findOne({ email })

    if (!existUser) {
        return res.status(400).json({ message: "User not found", success: false })
    }

    const userId = existUser._id

    const userAttendence = await Attendence.findOne({ user: userId , inTime : {$gte:today}  })


    if (!userAttendence) {
        return res.status(400).json({ message: "You have not checked In , first get yourself checked in " })
    }

    if(today < userAttendence.inTime){
        userAttendence.outTime = currentTime
        await userAttendence.save()
        return res.status(200).json({message : "You had check in and now your have checked out successfully"})
    }
}