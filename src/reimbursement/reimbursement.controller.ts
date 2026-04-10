// 1st controller --> Apply for reimbursement ((For user , admin , manager) protected Route)-POST request 
// steps : Check if the id for given for the bill  and the user is already present in the reimbursement model or not 
// if present throw ApiError

// else create the record in reimbursement Schema 

// Return res 



//2nd Controller --> Review the reimbursement ( For Admin and manager  - protected Route ) -PUT request 
//Steps : you will get the ID for the reimbursment record in the params , then validate the id by finding it in the reimbursment model 
// if not found throw ApiError

// else  get the status from req.body 
// and update the record 


// 3rd Controller --> Get your reimbursement ( for user , admin , manager - protected route ) - GET req 
// Steps : Just search te record if not found throw apiError 



// 4th Controller --> Get All reimbursement ( for admin , manager - protected route ) - GET req 
// Steps : check if user is admin/manager , if not throw ApiError 

// else fetch the entire table and send the table in res 



import { Request, Response } from "express"
import mongoose from "mongoose"
import { Reimbursement, reimbursementStatus } from "../database/reimbursement.model.js"
import { ApiError } from "../libs/class/api-error.js"

export const applyReimbursement = async (req: Request, res: Response) => {
        if (!req.user?.id) {
                throw new ApiError(401, "Unauthorized")
        }

        const userId = req.user.id
        const { billImg, billAmount, dateOfPayment, description } = req.body

        if (!billImg || !billAmount || !dateOfPayment) {
                throw new ApiError(400, "Required fields are missing")
        }

        const existing = await Reimbursement.findOne({ user: userId, billImg })

        if (existing) {
                throw new ApiError(400, "Reimbursement already exists for this bill")
        }

        const reimbursement = await Reimbursement.create({
                user: userId,
                billImg,
                billAmount,
                dateOfPayment,
                description
        })

        return res.status(201).json({
                success: true,
                message: "Applied for reimbursement successfully",
                data: reimbursement
        })
}


export const reviewReimbursement = async (req: Request, res: Response) => {
        if (!req.user?.role) {
                throw new ApiError(401, "Unauthorized")
        }

        const role = req.user.role

        const { id } = req.params
        const { status } = req.body

        if (typeof id !== "string") {
                throw new ApiError(400, "Invalid reimbursement ID");
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new ApiError(400, "Invalid reimbursement ID");
        }
        if (!reimbursementStatus.includes(status)) {
                throw new ApiError(400, "Invalid status value")
        }

        const reimbursement = await Reimbursement.findById(id)

        if (!reimbursement) {
                throw new ApiError(404, "Reimbursement not found")
        }

        reimbursement.status = status
        await reimbursement.save()

        return res.status(200).json({
                success: true,
                message: "Reimbursement reviewed successfully",
                data: reimbursement
        })
}


export const getMyReimbursements = async (req: Request, res: Response) => {
        if (!req.user?.id) {
                throw new ApiError(401, "Unauthorized")
        }

        const userId = req.user.id

        const reimbursements = await Reimbursement
                .find({ user: userId })
                .lean()

        if (!reimbursements.length) {
                throw new ApiError(404, "No reimbursements found")
        }

        return res.status(200).json({
                success: true,
                message: "Reimbursements fetched successfully",
                data: reimbursements
        })
}

export const getAllReimbursements = async (req: Request, res: Response) => {
        if (!req.user?.role) {
                throw new ApiError(401, "Unauthorized")
        }

        const role = req.user.role

        const reimbursements = await Reimbursement
                .find()
                .populate("user", "name email")
                .lean()

        return res.status(200).json({
                success: true,
                message: "All reimbursements fetched successfully",
                data: reimbursements
        })
}