import { Router } from "express"
import { checkInController } from "./checkInCheckOut/checkIn.controller.js"
import { attendenceCorrectionReqController } from "./attendenceCorrection/attendenceCorrectionReq.controller.js"
import { Request,Response } from "express"
import { checkOutController } from "./checkInCheckOut/checkOut.controller.js"
import { User } from "../database/user.model.js"
import { Attendence } from "../database/attendence.model.js"
import { attendenceCorrectionResController } from "./attendenceCorrection/attendenceCorrectionRes.controller.js"
import { showRequestedCorrection } from "./attendenceCorrection/attendenceShowReq.controller.js"
import { addholidayController } from "./holiday/addHoliday.controller.js"
import { success } from "zod"
import { Holiday } from "../database/holiday.model.js"


const attendenceRouter = Router()

attendenceRouter.get("/", async (req:Request, res:Response) => {
    

    const user = req.user

    if(!user){
        return res.status(400).json({message:"User not found"})
    }

    const today = new Date
    today.setHours(0,0,0,0)

    const hasCheckedIn = await Attendence.findOne({user:user.id , inTime:{$gte:today}})
    const hasCheckedOut = await Attendence.findOne({user:user.id , outTime:{$gte:today}})

    if(hasCheckedOut && hasCheckedIn){
        return res.status(200).json({message:"the User has checked-in and has checked-out as well"})
    }else if(hasCheckedIn && !hasCheckedOut){
        return res.status(200).json({message:"The user has only Check-In and have not yet checked-Out"})
    }else{
        return res.status(200).json({message:"The user has not checked-In yet "})
    }

})

attendenceRouter.get("/holiday/get-all",async(req:Request , res:Response)=>{

    const user = req.user 

    if(!user){
        return res.status(400).json({message:"The user is not found " , success : true })
    }

    try {
        const allHoliday = await Holiday.find()

        return res.status(200).json({message:"All Holidays that you have are : " , data : allHoliday , success : true })
    } catch (error) {
        return res.status(400).json({message:"There is an error " , success:true})
    }

})


attendenceRouter.post("/check-in",checkInController)
attendenceRouter.post("/check-out",checkOutController)
attendenceRouter.post("/attendenceCorrectionReq",attendenceCorrectionReqController)
attendenceRouter.post("/attendenceCorrectionRes" , attendenceCorrectionResController) 
attendenceRouter.get("/attendceCorrectionReq",showRequestedCorrection)
attendenceRouter.post("/holiday/create",addholidayController)

export default attendenceRouter