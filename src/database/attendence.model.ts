import mongoose from "mongoose";


const attendenceSchema = new mongoose.Schema ({
    userID :{
        type : mongoose.Schema.Types.ObjectId ,
        ref:"User",
        required : true 
    },
    inTime :{
        type : Date , 
        required : true 
    },
    outTime : {
        type : Date  
    },
    Date: {
        type: Date
    },
    status :{
        type : String ,
        enum : ["present", "absent" , "half-day" ],
        default : "present"
    },
    isLate : {
        type : Boolean ,
        default : true
    }
},{timestamps : true})

export type AttendenceType = mongoose.InferSchemaType<typeof attendenceSchema>
export const Attendence = mongoose.model("Attendence",attendenceSchema)