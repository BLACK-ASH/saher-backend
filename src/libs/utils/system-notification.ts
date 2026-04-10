import { Notification} from "../../database/notification.model.js"
import { ApiError } from "../class/api-error.js";

type SendNotificationTypes = {
  userID: string;
  title: string;
  description: string;
  type: "Announcement" | "Urgent" |"Reminder" |"Request"| "Task";
};

export const sendSystemNotification = async({userID  , type , title , description }:SendNotificationTypes)=>{

    if(!userID){
        throw new ApiError(400,"User ID is required ")
    }

    if(!type){
        throw new ApiError(400,"type is required ")
    }
    if(!title.trim()){
        throw new ApiError(400,"title is required ")
    }
    if(!description.trim()){
        throw new ApiError(400,"description is required ")
    }

    const notification = await Notification.create({
        user : userID ,
        type : type ,
        title : title ,
        description : description 
    })

    return notification
}