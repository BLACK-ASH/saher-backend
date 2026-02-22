import mongoose from "mongoose";
import { date } from "zod";

const attendeceCorrectionSchema = new mongoose.Schema({
    requestedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    reason:{
        type:String,
        required:true
    },
    inTime :{
        type:Date ,
        required : true 
    },
    outTime : {
        type:Date ,
        required : true
    },
    dateForCorrection:{
        type:Date,
        required:true
    },
    demandsToBe:{
        type:String,
        enum : ["present","absent","half-day"],
        required : true
    },
    requestStatus : {
        type : String ,
        enum : ["Approved","Rejected","Hold"]
    }
})

export const AttendenceCorrection = mongoose.model("AttendenceCorrection",attendeceCorrectionSchema)
