import z from "zod"


export const retrieveAttendanceSchema = z.object({
    type : z.enum(["week", "month" , "year"]),
    startDate : z. 
})