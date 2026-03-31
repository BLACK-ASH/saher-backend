import { Request , Response } from "express"
import { Holiday } from "../../database/holiday.model.js"

export const addholidayController = async(req:Request, res:Response)=>{
    const user = await req.user
    if(!user){
        return res.status(400).json({message:"User not registered", success : false})
    }
    const role = req.user?.role 
    if(role?.toLowerCase()!=="admin"){
        return res.status(400).json({message:"You are not the admin", success:false})
    }


    const { date , title , type } = req.body
    try{
    const newHolioday = await Holiday.create({
        date : date ,
        title : title , 
        type : type 
    })

    return res.status(200).json({message:"The holiday has been added successfully" , success:true})
    }catch(error){
        return res.status(400).json({message:"There is a DB Error " , success:false})
    }


}