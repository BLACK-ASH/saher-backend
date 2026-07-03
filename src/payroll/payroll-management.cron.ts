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
    if (!employeeAccount) throw new ApiError(400, 'Account not found');

    // Calculating the First and Last day of month
    const date = new Date();
    const firstDateOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    const lastDateOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    await Promise.all(
        employeeAccount.map(async (a) => {

            // The payroll already exist or not
            const existPayroll = await Payroll.findOne({
                user: a.user,
                dateOfCreation: {
                    $gte: standardDateString(firstDateOfMonth),
                    $lte: standardDateString(lastDateOfMonth)
                }
            })
            if (existPayroll) return null

            let baseSalary = Number(a.salaryStructure);

            // Finding the employee attendance of half-day, week-off and on-leave of employee for this month
            const employeeAttendance = await Attendance.find({
                user: a.user,
                // date: { $gte: standardDateString(firstDateOfMonth), $lte: standardDateString(lastDateOfMonth) },
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

            // Calculating one day and half day salary
            const oneDaySalary = Math.ceil(baseSalary / workingDays);
            const halfDaySalary = Math.ceil(oneDaySalary / 2)

            // Calculating and deducting days salary in which employee is onLeave or halfDay
            const leaveDeduction = oneDaySalary * onLeave;
            const halfDayDeduction = halfDaySalary * halfDay

            // Adding both we get the deduction amount of employee and then substract it from baseSalary
            let finalSalary = 0
            if (employeeAttendance.length > 0) {
                finalSalary = baseSalary - (leaveDeduction + halfDayDeduction);
            }

            await Payroll.create({
                user: a.user,
                dateOfCreation: standardDateString(date),
                workingDays,
                baseSalary,
                expectedSalary: Math.ceil(finalSalary),
                deduction: `${onLeave} Leave days salary deduction: ${leaveDeduction} \n ${halfDay} Half-days salary deduction ${halfDayDeduction} \n Total Deduction ${leaveDeduction + halfDayDeduction}`,
            })
        }))

    return ApiResponse.success(res, {
        message: "Payroll calculation",
        data: null,
        statusCode: 200,
    });
}
