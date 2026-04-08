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
        return res.status(200).json({message:"There are no mails for you" , count : 0 })
    }

    return res.status(200).json({message:"The mails in your inbox are " , data : record , count : length , success : true  })
}



export const sendMailController = async(req : Request , res:Response)=>{
    const user = req.user 

    const { receiversID , subject , body } = req.body

    
    if(!Array.isArray(receiversID) || receiversID.length === 0){
        throw new ApiError(400 , " ReceiversID must be a non empty array")
    }
    
    if (receiversID.includes(user?.id.toString())) {
        throw new ApiError(400, "You cannot send mail to yourself");
}
    const receivers  = await User.find({ _id : { $in :receiversID}}) 
    if(receivers.length !== receiversID.length){
        throw new ApiError(404,"Some users were noit found")
    }
   const mails = receiversID.map( id =>({
        from : user?.id,
        to: id ,
        subject : subject , 
        body : body
    }))

    await Mail.insertMany(mails)

    return res.status(201).json({message:`The mail has been sent to ${receiversID} ` , count : receiversID.length ,  success : true })

}


export const outboxController = async(req:Request , res:Response)=>{
    const user = req.user 

    const record = await Mail.find({from:user?.id})

    if(record.length === 0){
        return res.status(200).json({message:"There are no mails for you" , count : 0 })

    }

    return res.status(200).json({message:"The mails sent by you are " , data : record  , count: record.length})
}

// export const sendMailToAllController = async(req:Request , res:Response)=>{
//     const user = req.user 

//     if(user?.role !== "admin" &&  user?.role !== "manager"){
//         throw new ApiError(403,"Onlu Admins and managers  are allowed to send mails to everyone at once ")
//     }

//     const { subject , body } = req.body 

//     const users = await User.find({ _id :{$ne:user?.id}})

//     if(users.length === 0){
//         throw new ApiError(404,"No Users were found to send this mail")
//     }

//     const mails = users.map( oneUser =>({
//         from : user?.id,
//         to : oneUser._id ,
//         subject : subject , 
//         body : body
//     }))

//     await Mail.insertMany(mails)

//     return res.status(200).json({message:`The mail with subject ${subject} has been sent to ${users.length}` , count : mails.length ,success:true })
// }
