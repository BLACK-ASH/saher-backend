import mongoose from "mongoose"

export const reimbursementStatus = ["ON-HOLD","REJECTED","ACCEPTED","PAID"]

const reimbursementSchema = new mongoose.Schema({
    user :{
        type : mongoose.Schema.Types.ObjectId ,
        ref : "User" ,
        required : true 
    },
    billImg :{
        type : mongoose.Schema.Types.ObjectId ,
        ref: "Media",
        required : true 
    },
    billAmount :{
        type :Number,
        required : true 
    },
    dateOfPayment : {
        type : Date,
        required : true 
    }, 
    description : {
        type:String
    },
    status : {
        type : String ,
        enum : reimbursementStatus,
        default : "ON-HOLD"
    }
})