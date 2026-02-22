import { Router } from "express"
import { checkInController } from "./checkInCheckOut/checkIn.controller.js"
import { attendenceCorrectionReqController } from "./attendenceCorrection/attendenceCorrectionReq.controller.js"
import { Request,Response } from "express"
import { checkOutController } from "./checkInCheckOut/checkOut.controller.js"
import { User } from "../database/user.model.js"
import { Attendence } from "../database/attendence.model.js"


const attendenceRouter = Router()

attendenceRouter.get("/", async (req:Request, res:Response) => {
    

    const user = await User.findById(req.user?.id)

    if(!user){
        return res.status(400).json({message:"User not found"})
    }

    const today = new Date
    today.setHours(0,0,0,0)

    const hasCheckedIn = await Attendence.findOne({user:user._id , inTime:{$gte:today}})
    const hasCheckedOut = await Attendence.findOne({user:user._id , outTime:{$gte:today}})

    if(hasCheckedOut && hasCheckedIn){
        return res.status(200).json({message:"the User has checked-in and has checked-out as well"})
    }else if(hasCheckedIn && !hasCheckedOut){
        return res.status(200).json({message:"The user has only Check-In and have not yet checked-Out"})
    }else{
        return res.status(200).json({message:"The user has not checked-In yet "})
    }

})

attendenceRouter.post("/checkIn",checkInController)
attendenceRouter.post("/checkOut",checkOutController)
attendenceRouter.post("/attendenceCorrection",attendenceCorrectionReqController)

export default attendenceRouter