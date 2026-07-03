import { Request, Response } from "express";
import { Payroll } from "../database/payroll.model.js";
import { ApiError } from "../libs/class/api-error.js";
import { normalizeDoc } from "../libs/utils/normailize-doc.js";
import { payrollResponseSchema } from "./schema.js";
import { ApiResponse } from "../libs/class/api-response.js";

// To get all payroll according to information
export const getAllPayrollController = async (req: Request, res: Response) => {

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const count = await Payroll.countDocuments();

    const date = new Date();

    const year = Number(req.query.year) || date.getFullYear();
    const month = Number(req.query.month) - 1 || date.getMonth();

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 1)

    const payrolls = await Payroll.find({
        dateOfCreation: {
            $gte: firstDay, $lt: lastDay
        }
    }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

    if (payrolls.length === 0) throw new ApiError(400, 'No data Found');

    const normalized = normalizeDoc(payrolls);
    const parsed = payrollResponseSchema.parse(normalized);

    return ApiResponse.success(res, {
        message: "Payrolls fetched succesfully",
        data: parsed,
        statusCode: 200,
        meta: { page, limit, count, totalPages: Math.ceil(count / limit) },
    });
}

// To get payroll from user id
export const getPayrollByUserIdController = async (req: Request, res: Response) => {

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const count = await Payroll.countDocuments({ user: req.params.id });


    const payrolls = await Payroll.find({
        user: req.params.id,
    }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

    if (payrolls.length === 0) throw new ApiError(400, 'No data Found');

    const normalized = normalizeDoc(payrolls);
    const parsed = payrollResponseSchema.parse(normalized);

    return ApiResponse.success(res, {
        message: "Payrolls fetched succesfully",
        data: parsed,
        statusCode: 200,
        meta: { page, limit, count, totalPages: Math.ceil(count / limit) },
    });
}

export const getPayrollByPayrollIdController = async (req: Request, res: Response) => {

    const payrolls = await Payroll.findOne({
        _id: req.params.id,
    }).lean();

    if (!payrolls) throw new ApiError(400, 'No data Found');

    const normalized = normalizeDoc(payrolls);
    const parsed = payrollResponseSchema.parse(normalized);

    return ApiResponse.success(res, {
        message: "Payrolls fetched succesfully",
        data: parsed,
        statusCode: 200,
    });
}