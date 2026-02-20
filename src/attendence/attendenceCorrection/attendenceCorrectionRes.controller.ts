import { Request, Response } from "express"
import { AttendenceCorrection } from "../../database/attendenceCorrectrion.model.js"
import { Attendence } from "../../database/attendence.model.js"


export const attendenceCorrectionResController = async (req: Request, res: Response) => {
    const { id, status } = req.body

    const record = await AttendenceCorrection.findOne({ requestedBy: id })

    if (!record) {
        return res.status(400).json({ message: "User not found " })
    }

    try {

        record.requestStatus = status
        await record.save()

    } catch (error) {
        res.status(400).json({message:"The record was not updated"})
    }

    
}