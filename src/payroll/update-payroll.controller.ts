import { Request, Response } from "express";
import { Payroll } from "../database/payroll.model.js";
import { ApiError } from "../libs/class/api-error.js";
import { User } from "../database/user.model.js";
import { ApiResponse } from "../libs/class/api-response.js";
import { notification } from "../libs/utils/notification.js";

export const payrollController = async (req: Request, res: Response) => {
    
    // Taking employee from params and finding their account 
    const employee = await Payroll.findOne({ _id: req.params.id });
    if (!employee) throw new ApiError(400, 'Payroll not found');
    
    const user = await User.findOne({ _id: employee.user });
    if (!user) throw new ApiError(400, "User not Found");

    let { mode, paidSalary } = req.body;

    // Taking the employee salary structure, adiing bonus and removing deduction
    const expectedSalary = Number(employee.expectedSalary)
 
    let remainingSalary = 0, bonus = 0
    if (expectedSalary > paidSalary) {
        remainingSalary = Number(expectedSalary) - Number(paidSalary);
    }
    else {
        bonus = Number(paidSalary) - Number(expectedSalary)
    }

    let status = remainingSalary == 0 ? 'paid' : "partially-paid";

    if(employee.status === 'paid') throw new ApiError(400,"Payment already paid")

    if (employee.status === 'unpaid') {
        employee.dateOfPayment = new Date();
        employee.remainingSalary = remainingSalary;
        employee.mode = mode;
        employee.bonus = bonus;
        employee.status = status;
        employee.paidSalary = paidSalary;
        await employee.save();
    }

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
        message: 'user payment paid succesfully',
        data: null,
        statusCode: 200,
    });
};