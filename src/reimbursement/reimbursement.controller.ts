import { Request, Response } from "express"
import mongoose from "mongoose"
import { Reimbursement, reimbursementStatus } from "../database/reimbursement.model.js"
import { ApiError } from "../libs/class/api-error.js"
import { isPastDate} from "../libs/utils/check-date.js"

// export const applyReimbursement = async (req: Request, res: Response) => {
//         if (!req.user?.id) {
//                 throw new ApiError(401, "Unauthorized")
//         }
//         const userId = req.user.id
//         const { billImg, billAmount, dateOfPayment, description } = req.body

//         if (!billImg || !billAmount || !dateOfPayment) {
//                 throw new ApiError(400, "Required fields are missing")
//         }

//         const existing = await Reimbursement.findOne({ user: userId, billImg })

//         if (existing) {
//                 throw new ApiError(400, "Reimbursement already exists for this bill")
//         }

//         const reimbursement = await Reimbursement.create({
//                 user: userId,
//                 billImg,
//                 billAmount,
//                 dateOfPayment,
//                 description
//         })

//         return res.status(201).json({
//                 success: true,
//                 message: "Applied for reimbursement successfully",
//                 data: reimbursement
//         })
// }


// export const reviewReimbursement = async (req: Request, res: Response) => {
//         if (!req.user?.role) {
//                 throw new ApiError(401, "Unauthorized")
//         }

//         const role = req.user.role

//         const { id } = req.params
//         const { status } = req.body

//         if (typeof id !== "string") {
//                 throw new ApiError(400, "Invalid reimbursement ID");
//         }

//         if (!mongoose.Types.ObjectId.isValid(id)) {
//                 throw new ApiError(400, "Invalid reimbursement ID");
//         }
//         if (!reimbursementStatus.includes(status)) {
//                 throw new ApiError(400, "Invalid status value")
//         }

//         const reimbursement = await Reimbursement.findById(id)

//         if (!reimbursement) {
//                 throw new ApiError(404, "Reimbursement not found")
//         }

//         reimbursement.status = status
//         await reimbursement.save()

//         return res.status(200).json({
//                 success: true,
//                 message: "Reimbursement reviewed successfully",
//                 data: reimbursement
//         })
// }


// export const getMyReimbursements = async (req: Request, res: Response) => {
//         if (!req.user?.id) {
//                 throw new ApiError(401, "Unauthorized")
//         }

//         const userId = req.user.id

//         const reimbursements = await Reimbursement
//                 .find({ user: userId })
//                 .lean()

//         if (!reimbursements.length) {
//                 throw new ApiError(404, "No reimbursements found")
//         }

//         return res.status(200).json({
//                 success: true,
//                 message: "Reimbursements fetched successfully",
//                 data: reimbursements
//         })
// }

// export const getAllReimbursements = async (req: Request, res: Response) => {
//         if (!req.user?.role) {
//                 throw new ApiError(401, "Unauthorized")
//         }

//         const role = req.user.role

//         const reimbursements = await Reimbursement
//                 .find()
//                 .populate("user", "name email")
//                 .lean()

//         return res.status(200).json({
//                 success: true,
//                 message: "All reimbursements fetched successfully",
//                 data: reimbursements
//         })
// }


export const createReimbursement = async (req: Request, res: Response) => {

        const user = req.user
        const { billImg, billAmount, dateOfPayment, description } = req.body
        const existingReimbursement = await Reimbursement.findOne({ user: user?.id, billImg :billImg })
        if (existingReimbursement) {
                throw new ApiError(400, "Reimbursement already exists for this bill")
        }
        const ispast = isPastDate(dateOfPayment)

        if(!ispast){
                throw new ApiError(400,"Dates of future are not allowed")
        }
        const reimbursement = await Reimbursement.create({
                user: user?.id,
                billImg :billImg,
                billAmount : billAmount,
                dateOfPayment : dateOfPayment,
                description : description
        })

        return res.status(201).json({success: true,message: "Applied for reimbursement successfully",data: reimbursement})
}


export const reviewReimbursement = async (req: Request, res: Response) => {
        const { id } = req.params
        const { status } = req.body

        const reimbursement = await Reimbursement.findByIdAndUpdate(id , {status : status} , {new : true })
        if (!reimbursement) {
                throw new ApiError(404, "Reimbursement not found")
        }

        return res.status(200).json({success: true,message: "Reimbursement reviewed successfully",data: reimbursement})
}


export const getMyReimbursements = async (req: Request, res: Response) => {
        const userId = req.user?.id
        const reimbursements = await Reimbursement.find({ user: userId }).lean()
        if (!reimbursements.length) {
                throw new ApiError(404, "No reimbursements found")
        }
        return res.status(200).json({success: true,message: "Reimbursements fetched successfully",data: reimbursements})
}

export const getAllReimbursements = async (req: Request, res: Response) => {
        const role = req.user?.role

        if(role !== "admin" && role !== "manager" ){
                throw new ApiError(403,"Only admins and managers are permitted ")
        }
        const reimbursements = await Reimbursement.find().populate("user", "name email").lean()
        return res.status(200).json({success: true,message: "All reimbursements fetched successfully",data: reimbursements})
}