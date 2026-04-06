import mongoose from "mongoose";

export const notificationTypes = ["Announcement" , "Urgent" , "Reminder" , "Request" , "Task"]

const notificationSchema = new mongoose.Schema({
    type :{
        type:String,
        enum : notificationTypes ,
        required : true
    },
    title:{
        type : String ,
        required : true
    },
    description : {
        type : String 
    }
} , {timestamps : true} )

export const Notification = mongoose.model("Notification" , notificationSchema) 