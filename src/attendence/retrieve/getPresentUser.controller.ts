import { Request , Response } from "express";
import { ApiError } from "../../libs/class/api-error.js";
import { Attendance } from "../../database/attendance.model.js";

export const getPresentUserController = async(req:Request , res:Response)=>{
    const user = req.user

    if(user?.role !== "admin"){
        throw new ApiError(400,"Only Admins are allowed")
    }

    const date = req.query.date
    if(!date || typeof date !== "string" ){
        throw new ApiError(400 , "The Date format is incorrect")
    }
    const finalDate = new Date(date) 
    const now  = new Date() 

    if (isNaN(finalDate.getTime())){
        throw new ApiError(400 , "Please Enter Valid Date")
    }
    if(finalDate > now ){
        throw new ApiError(400,"The Date can not be of Future")
    }

    const record = await Attendance.find({
        date : finalDate.toLocaleDateString(),
        status :"half-day"
    })

    return res.status(200).json({message:"The users that were present on the given date are " , date: record , count:record.length})






}