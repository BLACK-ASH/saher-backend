import { Router } from "express"
import { markAttendenceController } from "./markAttendence.controller.js"
import { attendenceCorrectionController } from "./attendenceCorrection.controller.js"
import { Request,Response } from "express"


const attendenceRouter = Router()

attendenceRouter.get("/", async (req:Request, res:Response) => {
    res.json({message:"You are at the attendence route " , success:true}).status(200)
})

attendenceRouter.post("/markAttendence",markAttendenceController)

attendenceRouter.post("/attendenceCorrection",attendenceCorrectionController)

export default attendenceRouter