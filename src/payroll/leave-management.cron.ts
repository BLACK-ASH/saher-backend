
import e, { Request, Response } from "express"
import { User } from "../database/user.model.js"
import { ApiError } from "../libs/class/api-error.js";
import { Account } from "../database/account.model.js";
import { Attendance } from "../database/attendance.model.js";
import { ApiResponse } from "../libs/class/api-response.js";
import { standardDateString } from "../libs/utils/standard-date.js";
import { normalizeDoc } from "../libs/utils/normailize-doc.js";

export const payrollLeaveMangement = async (req: Request, res: Response) => {

    // Finding employee in User
    const employee = await User.findById(req.params.id);
    if (!employee) throw new ApiError(400, 'User not found');

    // Finding Employee Account for baseSalary
    const employeeAccount = await Account.findOne({ user: req.params.id });
    if (!employeeAccount) throw new ApiError(400, 'Account not found');
    const baseSalary = Number(employeeAccount.salaryStructure)

    // Calculating the First and Last day of month
    const date = new Date();
    const firstDateOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    const lastDateOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // Finding the employee attendance of half-day, week-off and on-leave of employee for this month
    const employeeAttendance = await Attendance.find({
        user: req.params.id,
        // date: { $gte: standardDateString(firstDateOfMonth), $lte: standardDateString(lastDateOfMonth) },
        status: { $in: ['week-off', 'on-leave', 'half-day'] }
    }
    );
    if (employeeAttendance.length === 0) throw new ApiError(400, 'Attendance not found');

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
    // workingDays -= onLeave
    // workingDays -= halfDay

    // Adding both we get the deduction amount of employee and then substract it from baseSalary
    const finalSalary = baseSalary - (leaveDeduction + halfDayDeduction);

    const data = {
        name: employee.displayName,
        baseSalary: baseSalary,
        workingDays: workingDays,
        Leave: `${onLeave} Days of Leave salary deduction ${leaveDeduction}`,
        halfDay: `${halfDay} Days of Half-day salary deduction ${halfDayDeduction}`,
        calculatedSalary: Math.ceil(finalSalary),
    }

    return ApiResponse.success(res, {
        message: "Payroll calculation",
        data: data,
        statusCode: 200,
    })
}
