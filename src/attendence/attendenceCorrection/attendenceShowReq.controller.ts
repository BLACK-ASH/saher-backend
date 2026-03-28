import { AttendenceCorrection } from "../../database/attendenceCorrectrion.model.js"
import { User } from "../../database/user.model.js"
import { Request , Response} from "express"


export const showRequestedCorrection = async(req:Request , res:Response)=>{
    const user = await req.user

    if(!user){
        return res.status(400).json({message:"User not found"})
    }

    const submittedRequest = AttendenceCorrection.find({
        userID : user.id
    })

    if(!submittedRequest){
        return res.status(400).json({message:"There are no attendence Correction request made bty you " , success: false})
    }
    else{
        return res.status(200).json(submittedRequest)
    }


    // const requests = await 
}