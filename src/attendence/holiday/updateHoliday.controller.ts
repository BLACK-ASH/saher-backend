import { Request , Response } from "express";
import { Holiday } from "../../database/holiday.model.js";


export const updateHolidayController = async(req:Request, res:Response)=>{
    const ID = req.params 

    const user = req.user 
    if(!user){
        return res.status(400).json({message:"User not Found", success: false})
    }
    const role = req.user?.role 
    if(role?.toLowerCase()!=="admin"){
        return res.status(400).json({message:"You are not the admin", success:false})
    }
    try{
        const record = await Holiday.findOne({id : ID }) 

        if(!record){
            return res.status(400).json({message:"the Record you seek is not present " , success: false })
        }

        const { date , title , type} = req.body 

        try {
            record.title = title 
            record.date = date 
            record.type = type 

            const changeSaved = await record.save()
            return res.status(200).json({message:"the Holiday was Updated Successfully" , success : true })
        } catch (error) {
            return res.status(400).json({message:"Unable to save Holiday in the DB "})
        }
     
    }catch(error){
        return res.status(400).json({message:"Internal server error" , success: true })
    }
}