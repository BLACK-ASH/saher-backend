import { Request , Response  } from "express";
import { Holiday } from "../../database/holiday.model.js";

export const getHolidayController = async(req:Request , res:Response)=>{
    const user = req.user 
   
    const ID = req.params

    try {

        const record = await Holiday.find({id : ID})

        if(!record){
            return res.status(400).json({message:" you have no such  Holiday" , success : false})
        }

        return res.status(200).json({message: "These are the holidays for you " , success: true , data : record})
        
    } catch (error) {
        return res.status(400).json({message:"Internal Server error", success:false})
        
    }
}