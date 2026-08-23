import type { Request, Response } from 'express';

import { Account } from '../database/account.model.js';
import { Attendance } from '../database/attendance.model.js';
import { Leave } from '../database/leave.model.js';
import { Payroll } from '../database/payroll.model.js';
import { ApiError } from '../libs/class/api-error.js';
import { ApiResponse } from '../libs/class/api-response.js';
import { standardDateString } from '../libs/utils/standard-date.js';

export const payrollLeaveMangement = async (req: Request, res: Response) => {
  // Finding Employee Account for baseSalary
  const employeeAccount = await Account.find();
  if (employeeAccount.length === 0) throw new ApiError(400, 'No Accounts found');

  // Calculating the First and Last day of month
  const date = new Date();
  const firstDateOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDateOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  // Month window as IST date strings — same representation as Attendance.date
  const monthStartKey = standardDateString(firstDateOfMonth);
  const monthEndKey = standardDateString(lastDateOfMonth);

  const records: Array<{
    user: (typeof employeeAccount)[number]['user'];
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
        $lte: standardDateString(lastDateOfMonth),
      },
    });
    if (existPayroll) continue;

    const baseSalary = Number(a.salaryStructure);

    // Finding the employee attendance of half-day, week-off and on-leave of employee for this month
    const employeeAttendance = await Attendance.find({
      user: a.user,
      date: {
        $gte: standardDateString(firstDateOfMonth),
        $lte: standardDateString(lastDateOfMonth),
      },
      status: { $in: ['week-off', 'on-leave', 'half-day'] },
    });

    // T-03-03: Leave-based deductions must be backed by approved applications,
    // not just attendance-table flags.
    const approvedLeaves = await Leave.find({
      user: a.user,
      status: 'approved',
      startDate: { $lte: lastDateOfMonth },
      endDate: { $gte: firstDateOfMonth },
    });
    const approvedLeaveDays = new Set<string>();
    for (const l of approvedLeaves) {
      for (
        let d = new Date(l.startDate);
        d.getTime() <= l.endDate.getTime();
        d.setUTCDate(d.getUTCDate() + 1)
      ) {
        const key = d.toISOString().slice(0, 10);
        if (key >= monthStartKey && key <= monthEndKey) approvedLeaveDays.add(key);
      }
    }

    // Calculating the days in this month
    const daysInMonth = lastDateOfMonth.getDate();

    // Storing the employee data of how many days his 'on-leave', 'week-off', and 'half-day'
    let weekOff = 0,
      onLeave = 0,
      halfDay = 0;
    employeeAttendance.forEach((e) => {
      if (e.status === 'week-off') {
        weekOff++;
        return;
      }
      if (e.status !== 'on-leave' && e.status !== 'half-day') return;
      if (!approvedLeaveDays.has(e.date)) return;
      if (e.status === 'on-leave') onLeave++;
      else halfDay++;
    });

    // Calculating the employee working days by deducting the week-off
    const workingDays = daysInMonth - weekOff;
    if (workingDays <= 0) throw new ApiError(400, 'Working days cannot be zero.');

    // Calculating one day and half day salary
    const oneDaySalary = Math.round(baseSalary / workingDays);
    const halfDaySalary = Math.round(oneDaySalary / 2);

    // Calculating and deducting days salary in which employee is onLeave or halfDay
    const leaveDeduction = oneDaySalary * onLeave;
    const halfDayDeduction = halfDaySalary * halfDay;

    // Substract both from baseSalary
    const finalSalary = baseSalary - leaveDeduction - halfDayDeduction;

    const data = {
      user: a.user,
      dateOfCreation: standardDateString(date),
      workingDays,
      baseSalary,
      expectedSalary: Math.round(finalSalary),
      deduction: [
        `${onLeave} Leave days salary deduction: ${leaveDeduction}`,
        `${halfDay} Half-days salary deduction ${halfDayDeduction}`,
        `Total Deduction ${leaveDeduction + halfDayDeduction}`,
      ],
    };
    records.push(data);
  }
  if (records.length > 0) {
    await Payroll.insertMany(records);
  }

  return ApiResponse.success(res, {
    message: 'Payroll calculation',
    data: null,
    statusCode: 200,
  });
};
