import z from "zod";
import { objectId } from "../attendance/correction/correction.schema.js";

export const sendMailSchema = z.object({
    receiverID : objectId , 
    subject : z.string(),
    body : z.string()
})


export const sendMailToAllSchema = z.object({
    subject : z.string(),
    body : z.string()
})