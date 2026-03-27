
import { User } from "../../database/user.model.js";
import { AttendenceCorrection } from "../../database/attendenceCorrectrion.model.js";

import { Request,Response } from "express";


export const attendenceCorrectionReqController = async(req:Request,res:Response)=>{
    const currentDate = new Date
    currentDate.setHours(0,0,0,0)

    const user = await req.user
    if(!user){
        return res.status(400).json({message:"User not found"})
    }
    //destrucctring
    const {reason,date,demandsToBe,inTime,outTime,isLate} = req.body

    //date normalization
    const finalDate = new Date(date)
    finalDate.setHours(0,0,0,0)

    if (isNaN(finalDate.getTime())){
        return res.status(400).json({
            message:"Invalid date , you need to add a valid date ",success:false
        })
    }


    if(finalDate>currentDate){
        return res.status(406).json({message:"The date of future is not acceptable"})
    }

    const existingRequest = await AttendenceCorrection.findOne({requestedBy:user.id , dateForCorrection:finalDate})
    if(existingRequest){
        return res.status(400).json({message:"you have already submitted a request for this date"})
    }

    const newRequest = new AttendenceCorrection({
        requestedBy : user.id,
        reason : reason,
        inTime : inTime,
        outTime: outTime,
        dateForCorrection:finalDate,
        isLate:isLate,
        demandsToBe:demandsToBe
    })
    try{
        await newRequest.save()
        return res.status(202).json({message:"your correction request has been submitted ",success:true})
    }catch(error){
        console.log(error);
        
    }
}