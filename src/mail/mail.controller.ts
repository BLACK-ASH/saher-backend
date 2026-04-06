import { Request , Response } from "express";
import { Mail } from "../database/mail.model.js";
import { success } from "zod";
import { ApiError } from "../libs/class/api-error.js";

export const inboxController = async(req:Request , res:Response)=>{
    const user = req.user 

    const record = await Mail.find({to:user?.id})
    const length = record.length
    if(length === 0 ){
        throw new ApiError(400,"There are no mails for you")
    }

    return res.status(200).json({message:"The mails in your inbox are " , data : record , count : length , success : true  })
}

export const sendMailController = async(req : Request , res:Response)=>{
    const user = req.user 

    const { receiverID , subject , body } = req.body 

    const newMail = await Mail.create({
        from : user?.id ,
        to : receiverID ,
        subject : subject ,
        body : body 
    })

    return res.status(200).json({message:`The mail has been sent to ${receiverID} ` , success : true })

}


export const sendMailToAllController = async(req:Request , res:Response)=>{
    const user = req.user 

    if(user?.role !== "admin" &&  user?.role !== "manager"){
        throw new ApiError(400,"Onlu Admins and managers  are allowed to send mails to everyone at once ")
    }
}