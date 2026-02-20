import { Router } from "express"
import { checkInController } from "./checkInCheckOut/checkIn.controller.js"
import { attendenceCorrectionController } from "./attendenceCorrection.controller.js"
import { Request,Response } from "express"
import { checkOutController } from "./checkInCheckOut/checkOut.controller.js"


const attendenceRouter = Router()

attendenceRouter.get("/", async (req:Request, res:Response) => {
    res.json({message:"You are at the attendence route " , success:true}).status(200)
})

attendenceRouter.post("/checkIn",checkInController)
attendenceRouter.post("/checkOut",checkOutController)
attendenceRouter.post("/attendenceCorrection",attendenceCorrectionController)

export default attendenceRouter