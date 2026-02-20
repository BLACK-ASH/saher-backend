
import { User } from "../../database/user.model.js";
import { AttendenceCorrection } from "../../database/attendenceCorrectrion.model.js";

import { Request,Response } from "express";


export const attendenceCorrectionReqController = async(req:Request,res:Response)=>{
     const currentDate = new Date
    currentDate.setHours(0,0,0,0)

    //destrucctring
    const {email,reason,date,demandsToBe} = req.body

    //date normalization
    const finalDate = new Date(date)
    finalDate.setHours(0,0,0,0)

    if (isNaN(finalDate.getTime())){
        return res.status(400).json({
            message:"Invalid date , you need to add a valid date ",success:false
        })
    }

    const existUser = await User.findOne({email})

    if(!existUser){
        return res.status(404).json({message:"User not found",success:false})
    }

    if(finalDate>currentDate){
        return res.status(406).json({message:"The date of future is not acceptable"})
    }


    const newRequest = new AttendenceCorrection({
        requestedBy : existUser._id,
        reason : reason,
        dateForCorrection:finalDate,
        demandsToBe:demandsToBe
    })
    try{
        await newRequest.save()
        return res.status(202).json({message:"your correction request has been submitted ",success:true})
    }catch(error){
        console.log(error);
        
    }
}