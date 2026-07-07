import type { Request, Response } from 'express';

import { Payroll } from '../database/payroll.model.js';
import { User } from '../database/user.model.js';
import { ApiError } from '../libs/class/api-error.js';
import { ApiResponse } from '../libs/class/api-response.js';
import { notification } from '../libs/utils/notification.js';

export const payrollController = async (req: Request, res: Response) => {
  // Taking employee from params and finding their account
  const employee = await Payroll.findOne({ _id: req.params.id }).populate<{
    user: { _id: string; displayName: string };
  }>('user', 'displayName');
  if (!employee) throw new ApiError(400, 'Payroll not found');

  // const user = await User.findOne({ _id: employee.user });
  // if (!user) throw new ApiError(400, "User not Found");

  const { mode, paidSalary } = req.body;
  if (paidSalary <= 0) throw new ApiError(400, 'Paid salary must be greater than zero.');

  // Taking the employee salary structure, adiing bonus and removing deduction
  const expectedSalary = Number(employee.expectedSalary);

  let remainingSalary = 0,
    bonus = 0;
  if (expectedSalary > paidSalary) {
    remainingSalary = Number(expectedSalary) - Number(paidSalary);
  } else {
    bonus = Number(paidSalary) - Number(expectedSalary);
  }

  const status = remainingSalary == 0 ? 'paid' : 'partially-paid';

  if (employee.status === 'paid') throw new ApiError(400, 'Payment already paid');

  if (employee.status === 'unpaid' || employee.status === 'partially-paid') {
    employee.dateOfPayment = new Date();
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
  const notificationTitle = `${employee.user.displayName} your salary has been ${status}`;
  const notificationDesc = `${employee.user.displayName} your salary of ${paidSalary}₹ through ${String(mode).toUpperCase()} has been ${status} succesfully`;

  await notification.specific.success(
    [employee.user._id.toString()],
    notificationTitle,
    notificationDesc,
    action,
  );

  return ApiResponse.success(res, {
    message: 'user payment paid succesfully',
    data: null,
    statusCode: 200,
  });
};
