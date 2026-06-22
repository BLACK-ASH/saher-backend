import { Request, Response } from "express";
import { Account } from "../database/account.model.js";
import { Payroll } from "../database/payroll.model.js";
import { ApiError } from "../libs/class/api-error.js";
import { User } from "../database/user.model.js";
import { ApiResponse } from "../libs/class/api-response.js";
import { notification } from "../libs/utils/notification.js";
import { normalizeDoc } from "../libs/utils/normailize-doc.js";
import { payrollResponseSchema } from "./schema.js";
import { createKey, getCache, setCache } from "../libs/redis/redis-utils.js";

export const payrollController = async (req: Request, res: Response) => {
    // User 
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(400, 'User Not found')

    // Taking employee from params and finding their account 
    const employee = await Account.findOne({ user: req.params.id });
    if (!employee) throw new ApiError(400, 'Account not found');

    let { date, mode, paidSalary, bonus, deduction } = req.body;

    // Taking the employee salary structure, adiing bonus and removing deduction
    const expectedSalary = Number(employee?.salaryStructure) + Number(bonus || 0) - Number(deduction || 0);

    // If the salary is half paid then it will store in remainingSalary
    const remainingSalary = Number(expectedSalary) - Number(paidSalary);

    if (expectedSalary < paidSalary) throw new ApiError(400, `${paidSalary} amount is greater than user expected salary ${expectedSalary}`)

    // if remaining amount is 0 then salary is full paid if not then it is partially paid
    let status = remainingSalary <= 0 ? 'paid' : "partially-paid";

    const createPayroll = await Payroll.create({
        user: user.id,
        date,
        mode,
        expectedSalary,
        paidSalary,
        remainingSalary,
        bonus,
        deduction,
        status
    });

    const action = {
        type: 'none' as const,
        label: 'Payroll',
        url: '',
        method: 'POST' as const,
    };
    const notificationTitle = `${user.displayName} your salary has been ${status}`
    const notificationDesc = `${user.displayName} your salary of ${paidSalary}₹ through ${String(mode).toUpperCase()} has been ${status} succesfully`

    await notification.specific.success([user.id], notificationTitle, notificationDesc, action);

    return ApiResponse.success(res, {
        message: 'user payment created succesfully',
        data: null,
        statusCode: 200,
    });
};


// Get Payrolls
export const getPayrollController = async (req: Request, res: Response) => {
    const key = createKey('payrolls', 'list')
    const data = await getCache(key);

    if (data) {
        return ApiResponse.success(res, {
            message: 'Payrolls fetched succesfully',
            data: data,
            statusCode: 200,
        });
    }

    const page = Number(req.params.page) || 1;
    const limit = Number(req.params.limit) || 10;
    const skip = (page - 1) * limit;
    const count = await Payroll.countDocuments();

    const payrollList = await Payroll.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

    const normalized = normalizeDoc(payrollList);
    const parsed = payrollResponseSchema.parse(normalized);

    await setCache(key, parsed, 7200);

    return ApiResponse.success(res, {
        message: 'Payrolls fetched succesfully',
        data: parsed,
        statusCode: 200,
        meta: { page, limit, count, totalPages: Math.ceil(count / limit) }
    });
}