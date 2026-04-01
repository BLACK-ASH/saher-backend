import { Request , Response } from "express";
import { Holiday } from "../../database/holiday.model.js";

export const getAllHolidayController = async(req:Request , res:Response)=>{

    const user = req.user 

    

    try {
        const allHoliday = await Holiday.find()

        return res.status(200).json({message:"All Holidays that you have are : " , data : allHoliday , success : true })
    } catch (error) {
        return res.status(400).json({message:"There is an error " , success:true})
    }

}