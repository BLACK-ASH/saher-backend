import { Request, Response } from "express"
import { AttendenceCorrection } from "../../database/attendenceCorrectrion.model.js"
import { Attendence } from "../../database/attendence.model.js"


export const attendenceCorrectionResController = async (req: Request, res: Response) => {
    const { id, status , dateForCorrection} = req.body

    const record = await AttendenceCorrection.findOne({ requestedBy: id , dateForCorrection : dateForCorrection})

    if (!record) {
        return res.status(400).json({ message: "Record not found " })
    }

    if(status === "Approved"){
        const newRecord = await Attendence.create({
            user : record.requestedBy ,
            inTime : record.inTime ,
            outTime : record.outTime ,
            status : record.demandsToBe,   
        })

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