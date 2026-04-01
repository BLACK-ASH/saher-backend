import { Request, Response } from "express"
import { Attendence } from "../../database/attendence.model.js"
import { ApiError } from "../../libs/class/api-error.js"

export const checkInController = async (req: Request, res: Response) => {
  //Step 1 - Check if the user has token or not   
  const user = req.user
  const now = new Date()

  //Step 2 - Check karo ki user ne pehle se aaj ki attendence toh nahi mark kari hai 
  const existingRecord = await Attendence.findOne({
    user: user?.id,
    date: now.toLocaleDateString()
  })

  //Step 3 - Agr haa toh oosko dubara attendence mark karne mat do 
  // Using Custom Api Error Handler To Automatically handle error response
  if (existingRecord) throw new ApiError(400, "You Have Already Check In Today.")

  //Step 5 - if User exist and have not submitted today's attendence start making new entry 
  //Step6 - Note the current time so that late hai ki nahi ka pata chal sake 
  const expectedTime = new Date()
  //Abhi ke liye aise hii hardcore data liya hai 
  expectedTime.setHours(9, 0, 0, 0)
  const halfDaytiming = new Date()
  halfDaytiming.setHours(11, 0, 0, 0)

  const newRecord = await Attendence.create({
    user: user?.id,
    inTime: now,
    status: now > halfDaytiming ? "half-day" : "present",
    date: now.toLocaleDateString(),
    isLate: now > expectedTime
  })
  return res.status(200).json({ message: "You have been marked present", success: true, data: newRecord })

}
