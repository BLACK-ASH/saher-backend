import { Request, Response } from "express"
import { Attendance } from "../../database/attendance.model.js"
import { ApiError } from "../../libs/class/api-error.js"

export const checkInController = async (req: Request, res: Response) => {
  //Step 1 - Check if the user has token or not   
  const user = req.user
  const now = new Date()

  //Step 2 - Check karo ki user ne pehle se aaj ki attendence toh nahi mark kari hai 
  const existingRecord = await Attendance.findOne({
    user: user?.id,
    date: now.toLocaleDateString(),
    inTime: { $ne: null },
  })
  //Step 3 - Agr haa toh oosko dubara attendence mark karne mat do 
  // Using Custom Api Error Handler To Automatically handle error response
  if (existingRecord) throw new ApiError(400, "You Have Already Check In Today.")


  // Change Bad Mai Karna Hai
  const expectedTime = new Date()
  //Abhi ke liye aise hii hardcore data liya hai 
  expectedTime.setHours(9, 0, 0, 0)

  // Updating Cron Record
  const cronRecord = await Attendance.findOne({
    user: user?.id,
    date: now.toLocaleDateString(),
  })

  if (cronRecord) {
    cronRecord.inTime = now
    cronRecord.status = "present"
    cronRecord.isLate = now > expectedTime
    await cronRecord.save()
    return res.status(200).json({ message: "You have been marked present", success: true, data: cronRecord })
  }

  // Special case is user is check in before cron job 
  //Step 5 - if User exist and have not submitted today's attendence start making new entry 
  //Step6 - Note the current time so that late hai ki nahi ka pata chal sake 
  const newRecord = await Attendance.create({
    user: user?.id,
    inTime: now,
    status: "present",
    date: now.toLocaleDateString(),
    isLate: now > expectedTime
  })
  return res.status(200).json({ message: "You have been marked present", success: true, data: newRecord })

}
