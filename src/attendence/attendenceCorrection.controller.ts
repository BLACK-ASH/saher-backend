
import { User } from "../database/user.model.js";
import { AttendenceCorrection } from "../database/attendenceCorrectrion.model.js";
import { success } from "zod";
import { Request,Response } from "express";


export const attendenceCorrectionController = async(req:Request,res:Response)=>{
     const currentDate = new Date
    currentDate.setHours(0,0,0,0)

    //destrucctring
    const {email,reason,date,demandsToBe} = req.body

    //date normalization
    const finalDate = new Date(date)
    finalDate.setHours(0,0,0,0)

    if (isNaN(finalDate.getTime())){
        return res.status(400).json({
            message:"Ivalid date , you need to add a valid date ",success:false
        })
    }

    const existUser = await User.findOne({email})

    if(!existUser){
        return res.status(404).json({message:"User not found",success:false})
    }

    if(finalDate>currentDate){
        return res.status(406).json({message:"The date of future is not acceptable"})
    }


    const newRecord = new AttendenceCorrection({
        requestedBy : existUser._id,
        reason : reason,
        dateOfCorrection:finalDate,
        demandsToBe:demandsToBe
    })
    try{
        await newRecord.save()
        return res.status(202).json({message:"your correction request has been saved",success:true})
    }catch(error){
        console.log(error);
        
    }

}

