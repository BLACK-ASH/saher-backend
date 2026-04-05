import { Request, Response } from "express";
import { ApiError } from "../../libs/class/api-error.js";
import { Attendance } from "../../database/attendance.model.js";

export const retrieveAttendanceController = async (req: Request, res: Response) => {

  try {
    // Get the user body 
    const user = req.user

    // no matter whether the user want to retrive a custom range or a fixed range(like week/month/year) in every case the retrieve would be done by the startDate and endDate 
    let startDate, endDate

    //Agar user ko ek custom range chahiyetoh oos case mein user ko startDate and endDate dono hii banatani padegi
    if (req.query.startDate && req.query.endDate) {
      startDate = new Date(req.query.startDate as string)
      startDate.setHours(0, 0, 0, 0)

      endDate = new Date(req.query.endDate as string)
      endDate.setHours(23, 59, 59, 999)

      if (startDate > endDate) throw new ApiError(400, "The Datess that you have entered are invalid please check")

    }

    //Agar user ko custom range nahi chahiye toh fir user ke paas option hai ki woh retrieve karne ka type bata de 
    else if (req.query.type) {

      const today = new Date()

      endDate = new Date(today)
      if (req.query.type === "week") {
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 6)
      }
      else if (req.query.type === "month") {
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 29)
      }
      else if (req.query.type === "year") {
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 364)
      }
      else {
        throw new ApiError(400, "Enter a valid type for retrieving records like week , month , year")
      }
    }
    else {
      throw new ApiError(400, "Either you give the type of retriving or you give both start Date and end Date")
    }


    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    let finalID
    if (req.user?.role === "admin") {

      if (req.body.userID) {
        finalID = req.query.userID
      }
      else {
        finalID = req.user?.id
      }

    }

    //DB Functions 
    const record = await Attendance.find({
      user: finalID,
      date: {
        $gte: startDate.toLocaleDateString("en-CA",{timeZone : "Asia/Kolkata"}),
        $lte: endDate.toLocaleDateString("en-CA",{timeZone : "Asia/Kolkata"})
      }

    }).sort({ date: -1 })


    return res.status(200).json({ message: "The record you asked for ", data: record, count: record.length })

  } catch (error) {
    throw new ApiError(500, "Internal server error")
  }

}
