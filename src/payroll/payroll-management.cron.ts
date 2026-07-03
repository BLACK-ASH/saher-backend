import { Request, Response } from "express"
import { ApiError } from "../libs/class/api-error.js";
import { Account } from "../database/account.model.js";
import { Attendance } from "../database/attendance.model.js";
import { ApiResponse } from "../libs/class/api-response.js";
import { standardDateString } from "../libs/utils/standard-date.js";
import { Payroll } from "../database/payroll.model.js";

export const payrollLeaveMangement = async (req: Request, res: Response) => {

    // Finding Employee Account for baseSalary
    const employeeAccount = await Account.find();
    if (employeeAccount.length === 0) throw new ApiError(400, 'No Accounts found');

    // Calculating the First and Last day of month
    const date = new Date();
    const firstDateOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    const lastDateOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const records: Array<{
        user: typeof employeeAccount[number]["user"];
        dateOfCreation: string;
        workingDays: number;
        baseSalary: number;
        expectedSalary: number;
        deduction: string[];
    }> = [];

    for (const a of employeeAccount) {

        // This month payroll already exist or not
        const existPayroll = await Payroll.findOne({
            user: a.user,
            dateOfCreation: {
                $gte: standardDateString(firstDateOfMonth),
                $lte: standardDateString(lastDateOfMonth)
            }
        })
        if (existPayroll) continue

        let baseSalary = Number(a.salaryStructure);

        // Finding the employee attendance of half-day, week-off and on-leave of employee for this month
        const employeeAttendance = await Attendance.find({
            user: a.user,
            date: { $gte: standardDateString(firstDateOfMonth), $lte: standardDateString(lastDateOfMonth) },
            status: { $in: ['week-off', 'on-leave', 'half-day'] }
        }
        );

        // Calculating the days in this month
        let daysInMonth = lastDateOfMonth.getDate();

        // Storing the employee data of how many days his 'on-leave', 'week-off', and 'half-day'
        let weekOff = 0, onLeave = 0, halfDay = 0
        employeeAttendance.forEach(e => {
            if (e.status === 'week-off') weekOff++
            if (e.status === 'on-leave') onLeave++
            if (e.status === 'half-day') halfDay++
        })

        // Calculating the employee working days by deducting the week-off
        let workingDays = daysInMonth - weekOff
        if (workingDays <= 0) throw new ApiError(400, "Working days cannot be zero.");

        // Calculating one day and half day salary
        const oneDaySalary = Math.round(baseSalary / workingDays);
        const halfDaySalary = Math.round(oneDaySalary / 2)

        // Calculating and deducting days salary in which employee is onLeave or halfDay
        const leaveDeduction = oneDaySalary * onLeave;
        const halfDayDeduction = halfDaySalary * halfDay

        // Substract both from baseSalary
        const finalSalary = baseSalary - leaveDeduction - halfDayDeduction;

        let data = {
            user: a.user,
            dateOfCreation: standardDateString(date),
            workingDays,
            baseSalary,
            expectedSalary: Math.round(finalSalary),
            deduction: [
                `${onLeave} Leave days salary deduction: ${leaveDeduction}`,
                `${halfDay} Half-days salary deduction ${halfDayDeduction}`,
                `Total Deduction ${leaveDeduction + halfDayDeduction}`,
            ]
        }
        records.push(data);
    };
    if (records.length > 0) {
        await Payroll.insertMany(records);
    };

    return ApiResponse.success(res, {
        message: "Payroll calculation",
        data: null,
        statusCode: 200,
    });
}
