import { Request , Response } from "express";
import { Holiday } from "../../database/holiday.model.js";

export const deleteHolidayController = async(req:Request , res:Response)=>{
    const user = req.user 
    
    const role = req.user?.role 
    if(role?.toLowerCase()!=="admin"){
        return res.status(400).json({message:"You are not the admin", success:false})
    }

    const ID = req.params 

    try {
        const record = await Holiday.findByIdAndDelete(ID)
        if(!record){
            return res.status(404).json({message:"There is no such Holiday" , success : true})
        }

        return res.status(200).json({message:"The Holiday has been deleted successfully" , success: true})

    } catch (error) {
        return res.status(400).json({message:"Internal Serverr Error" , success:true})
    }
}