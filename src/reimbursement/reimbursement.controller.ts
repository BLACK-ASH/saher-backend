import { Request, Response } from "express"
import mongoose from "mongoose"
import { Reimbursement } from "../database/reimbursement.model.js"
import { reimbursementIdSchema } from "./reimbursement.schema.js"
import { reimbursementReviewSchema } from "./reimbursement.schema.js"
import { reimbursementSchema } from "./reimbursement.schema.js"
import { ApiError } from "../libs/class/api-error.js"
import { isPastDate } from "../libs/utils/check-date.js"

export const createReimbursement = async (req: Request, res: Response) => {
        const user = req.user;

        const parsed = reimbursementSchema.safeParse(req.body);
        if (!parsed.success) {
                throw new ApiError(400, parsed.error.message);
        }

        const { billImg, billAmount, dateOfPayment, description } = parsed.data;

        const existingReimbursement = await Reimbursement.findOne({
                user: user?.id,
                billImg
        });

        if (existingReimbursement) {
                throw new ApiError(400, "Reimbursement already exists for this bill");
        }

        const reimbursement = await Reimbursement.create({
                user: user?.id,
                billImg,
                billAmount,
                dateOfPayment,
                description
        });

        return res.status(201).json({
                success: true,
                message: "Applied for reimbursement successfully",
                data: reimbursement
        });
};

export const reviewReimbursement = async (req: Request, res: Response) => {

        const paramParsed = reimbursementIdSchema.safeParse(req.params);
        if (!paramParsed.success) {
                throw new ApiError(400, paramParsed.error.message);
        }

        const bodyParsed = reimbursementReviewSchema.safeParse({
                ...req.body,
                id: req.params.id
        });

        if (!bodyParsed.success) {
                throw new ApiError(400, bodyParsed.error.message);
        }

        const { id, status } = bodyParsed.data;

        const reimbursement = await Reimbursement.findByIdAndUpdate(
                id,
                { status },
                { new: true }
        );

        if (!reimbursement) {
                throw new ApiError(404, "Reimbursement not found");
        }

        return res.status(200).json({
                success: true,
                message: "Reimbursement reviewed successfully",
                data: reimbursement
        });
};

export const getMyReimbursements = async (req: Request, res: Response) => {
        const userId = req.user?.id;

        const reimbursements = await Reimbursement.find({ user: userId }).lean();

        if (reimbursements.length === 0) {
                throw new ApiError(404, "No reimbursements found");
        }

        return res.status(200).json({
                success: true,
                message: "Reimbursements fetched successfully",
                data: reimbursements
        });
};

export const getAllReimbursements = async (req: Request, res: Response) => {
        const role = req.user?.role;

        if (!["admin", "manager"].includes(role!)) {
                throw new ApiError(403, "Only admins and managers are permitted");
        }

        const reimbursements = await Reimbursement.find()
                .populate("user", "name email")
                .lean();

        return res.status(200).json({
                success: true,
                message: "All reimbursements fetched successfully",
                data: reimbursements
        });
};