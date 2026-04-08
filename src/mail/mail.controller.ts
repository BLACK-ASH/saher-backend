import { Request , Response } from "express";
import { Mail } from "../database/mail.model.js";
import { success } from "zod";
import { ApiError } from "../libs/class/api-error.js";
import { User } from "../database/user.model.js";

export const inboxController = async(req:Request , res:Response)=>{
    const user = req.user 

    const record = await Mail.find({to:user?.id}).lean().sort({createdAt:-1})
    const length = record.length
    if(length === 0 ){
        throw new ApiError(400,"There are no mails for you")
    }

    return res.status(200).json({message:"The mails in your inbox are " , data : record , count : length , success : true  })
}

export const sendMailController = async(req : Request , res:Response)=>{
    const user = req.user 

    const { receiverID , subject , body } = req.body 

    const receiver = await User.findById(receiverID) 
    if(!receiver){
        throw new ApiError(404,"Please check the receiver email ID")
    }
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
        throw new ApiError(403,"Onlu Admins and managers  are allowed to send mails to everyone at once ")
    }

    const { subject , body } = req.body 

    const users = await User.find({ _id :{$ne:user?.id}})

    if(users.length === 0){
        throw new ApiError(404,"No Users were found to send this mail")
    }

    const mails = users.map( oneUser =>({
        from : user?.id,
        to : oneUser._id ,
        subject : subject , 
        body : body
    }))

    await Mail.insertMany(mails)

    return res.status(200).json({message:`The mail with subject ${subject} has been sent to ${users.length}` , count : mails.length ,success:true })
}


export const outboxController = async(req:Request , res:Response)=>{
    const user = req.user 

    const record = await Mail.find({from:user?.id})

    if(record.length === 0){
        throw new ApiError(404 , "There are no mails that you have sent")

    }

    return res.status(200).json({message:"The mails sent by you are " , data : record  , count: record.length})
}