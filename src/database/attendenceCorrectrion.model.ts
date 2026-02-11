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
    dateOfCorrection:{
        type:Date,
        required:true
    },
    demandsToBe:{
        type:String,
        enum : ["present","absent","half-day"],
        required : true
    }
})

export const AttendenceCorrection = mongoose.model("AttendenceCorrection",attendeceCorrectionSchema)
