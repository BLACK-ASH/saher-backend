import mongoose from "mongoose";


const holidaySchema = new mongoose.Schema({
    date:{
        type:Date ,
        required : true 
    },
    title : {
        type : String ,
        required : true 
    },
    type : {
        type:String ,
        enum : ["national" , "organizational" , "optional" , "other"],
        default : "national",
        required : true 
    }
},{timestamps:true})

export type HolidayType = mongoose.InferSchemaType<typeof holidaySchema>
export const Holiday = mongoose.model("Attendence",holidaySchema)