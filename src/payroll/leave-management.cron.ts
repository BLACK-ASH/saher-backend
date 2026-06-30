
import { Request, Response } from "express"
import { User } from "../database/user.model.js"
import { ApiError } from "../libs/class/api-error.js";
import { Account } from "../database/account.model.js";
import { Attendance } from "../database/attendance.model.js";
import { ApiResponse } from "../libs/class/api-response.js";


// Payroll create in every month last date

// We have to calculate all the present,weakOff,YearOff of the user and generate an amount of current month with including all this and then deduct personalLeave approved by admin and deduct the each days leave amount in generatete amount

/*Step by Step 
1. take the employee id from params 
    check whether the employee exist or not
    get the Account information of employee and from account take the salary tructure
2. calculate the total days of work of employee
    from attendance take this month of present data
    from leave find if the leave is weakOff or yearOff if the leave is one of them then take it
    (after including this we can get the day of work of employee and now we have to generate employee salary according to this days)
3. claculate the leaves of employee
    after calculating the days of work the remaining days are the leaves
    find the leaves of this days and see whether they are approved or not 
    if aprroved then deducted the amount of every leaves days (by dividing the salary/month * days of leaves - salary)
*/

export const payrollLeaveMangement = async (req: Request, res: Response) => {

    const employee = await User.findById(req.params.id);
    if (!employee) throw new ApiError(400, 'User not found');

    const employeeAccount = await Account.findById(req.params.id);
    if (!employeeAccount) throw new ApiError(400, 'Account not found');
    const baseSalary = Number(employeeAccount.salaryStructure)

    // Calculating the First and Month of month
    const date = new Date();
    const firstDateOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    const lastDateOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // Finding the attendance of Present and Halfday of employee
    const employeeAttendance = await Attendance.find({
        user: req.params.id,
        // date: { $gte: firstDateOfMonth.toISOString().split('T')[0], $lte: lastDateOfMonth.toISOString().split('T')[0] },
        status: { $in: ['present', 'half-day'] }
    }
    );
    if (!employeeAttendance) throw new ApiError(400, 'Attendance not found');

    // Separating the Present and Halfday
    let present = 0;
    let halfday = 0;
    employeeAttendance.forEach(e => {
        if (e.status === 'present') present++
        if (e.status === 'half-day') halfday++
    });

    // leave management
    // weak off 

    // Calculating the salary of employee from present and half-day attendance
    const onedaySalary = Number(baseSalary/present)
    const halfdaySalary = Number(baseSalary/halfday)/2

    return ApiResponse.success(res, {
        message: "Payroll calculation",
        data: null,
        statusCode: 200,
    })
}
