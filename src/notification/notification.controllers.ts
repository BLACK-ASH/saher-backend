import { Request , Response } from "express";
import { ApiError } from "../libs/class/api-error.js";
import { Notification } from "../database/notification.model.js";

//Create a new Notification
export const createNotificationController = async ( req:Request , res:Response)=>{
    const user = req.user 

    //Checking if the user is Admin 
    if(user?.role !== "admin" && user?.role !=="manager"){
        throw new ApiError(400,"Only Admins and managers are allowed to create a notification")
    }

    const { type , title , description } = req.body 

    const newNotification = await Notification.create({
        type : type ,
        title : title ,
        description : description 
    })

    return res.status(200).json({message:`The notification with the title ${title} has been successfully created` , success : true })
} 

//Get the most recent Notification 
export const getLatestNotificationController = async(req:Request , res:Response)=>{
    
    const countNotification = await Notification.countDocuments()
    if(countNotification === 0){
        return res.status(400).json({message:"You have no notifications yet " , success : false })
    }

    const latestNotification = await Notification.findOne().sort({createdAt : -1})
    return res.status(200).json({message:"The most recent notification is " , data : latestNotification  , success : true  })

}

//Get all the Notification 
export const getAlltNotificationController = async(req:Request , res:Response)=>{
    
    const countNotification = await Notification.countDocuments()
    if(countNotification === 0){
        return res.status(400).json({message:"You have no notifications yet " , success : false })
    }

    const allNotification = await Notification.find()
    return res.status(200).json({message:"The most recent notification is " , data : allNotification , count : allNotification.length  , success : true  })

}

