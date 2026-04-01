import { Request, Response } from "express"
import { AttendenceCorrection } from "../../database/attendenceCorrectrion.model.js"
import { Attendence } from "../../database/attendence.model.js"
import { success } from "zod"
import { log } from "node:console"


export const attendenceCorrectionResController = async (req: Request, res: Response) => {
    const { userID, status , dateForCorrection} = req.body

    const finalStatus = status.toLowerCase()
    const record = await AttendenceCorrection.findOne({ requestedBy: userID , dateForCorrection : dateForCorrection})

    if (!record) {
        return res.status(400).json({ message: "Record not found " })
    }

    if(finalStatus === "approved"){
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
            await record.deleteOne()
            return res.status(200).json({message:"The attendence correction request was approved and has been updated successfully" , success: true })
 
        } catch (error) {
            console.log(error)
            return res.status(400).json({message : "THere is some error"  , success : false})
        }
        

        
    }

    if (finalStatus=== "rejected"){
        await record.deleteOne()
        return res.status(200).json({message:"You have rejected the request and the record has been deleted "})
    }

    if (finalStatus === "hold"){
        return res.status(200).json({message : "You have put the request on hold"})
    }
    else{
        return res.status(404).json({message : "Please enter a valid status for attendence " , success : false})
    }

    
}