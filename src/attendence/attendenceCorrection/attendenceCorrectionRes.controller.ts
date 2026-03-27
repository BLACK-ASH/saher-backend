import { Request, Response } from "express"
import { AttendenceCorrection } from "../../database/attendenceCorrectrion.model.js"
import { Attendence } from "../../database/attendence.model.js"
import { success } from "zod"
import { log } from "node:console"


export const attendenceCorrectionResController = async (req: Request, res: Response) => {
    const { userID, status , dateForCorrection} = req.body

    const record = await AttendenceCorrection.findOne({ requestedBy: userID , dateForCorrection : dateForCorrection})

    if (!record) {
        return res.status(400).json({ message: "Record not found " })
    }

    if(status === "Approved"){
        const recordToEdit = await Attendence.findOne({ userID : userID , Date : record.dateForCorrection  })

        if(!recordToEdit){
            return res.status(404).json({message:"The record is not present in the attendence database" , success : false})
        }
        try {
            recordToEdit.inTime = record.inTime 
            recordToEdit.outTime = record.outTime
            recordToEdit.Date = record.dateForCorrection
            recordToEdit.status = record.demandsToBe
            recordToEdit.isLate = record.isLate
            await recordToEdit.save()
            return res.status(200).json({message:"The attendence correction request was approved and has been updated successfully" , success: true })

        } catch (error) {
            console.log(error)
            return res.status(400).json({message : "THere is some error"  , success : false})
        }
        

        return res.status(200).json({message:"you have approved the request the attendence has been updated"})
    }

    if (status === "Rejected"){
        await record.deleteOne()
        return res.status(200).json({message:"You have rejected the request and the record has been deleted "})
    }

    if (status === "Hold"){
        return res.status(200).json({message : "You have put the request on hold"})
    }
   

    
}