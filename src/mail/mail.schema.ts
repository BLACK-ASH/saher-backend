import z from "zod";
import { objectId } from "../attendance/correction/correction.schema.js";

export const sendMailSchema = z.object({
    receiverID : objectId , 
    subject : z.string().min(1).max(100),
    body : z.string().min(1).max(1000)
})


