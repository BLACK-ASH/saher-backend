import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { standardDateString } from '../../libs/utils/standard-date.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { Account } from '../../database/account.model.js';
import { calculateWorkStatus } from '../../libs/utils/calculate-work-status.js';
import { AttendanceResponseSchema, AttendanceSchemaFinal } from '../retrieve/me.controller.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { createKey, deleteCache, setCache } from '../../libs/redis/redis-utils.js';

const AttendanceCheckOutSchema = AttendanceResponseSchema.omit({ user: true }).readonly();
const CheckOutSetCacheSchema = AttendanceSchemaFinal.readonly();
export const checkOutController = async (req: Request, res: Response) => {
  const user = req.user;
  const now = new Date();

  const attendance = await Attendance.findOne({
    user: user?.id,
    date: standardDateString(now),
    inTime: { $ne: null },
  });

  //  If User Is Not Check In
  if (!attendance) throw new ApiError(400, 'You Have Not Checked in Today.');
  // If User Is Already Check Out
  if (attendance?.outTime) throw new ApiError(400, 'You Have Already Checked Out Today');

  // Calculate The Work Hour And Status
  const employeeDetails = {
    fullTime: {
      fullWorkHours: 9,
      halfWorkHours: 4.5,
      graceHours: 1,
      expectedTime: 9,
      shift: 'full-time',
    },
    partTimeShift1: {
      fullWorkHours: 4,
      halfWorkHours: 2,
      graceHours: 0.5,
      expectedTime: 9,
      shift: 'shift-1',
    },
    partTimeShift2: {
      fullWorkHours: 4,
      halfWorkHours: 2,
      graceHours: 0.5,
      expectedTime: 2,
      shift: 'shift-2',
    },
  } as const;

  let final;

  const account = await Account.findOne({ user: user?.id });
  if (!account) throw new ApiError(400, 'Account not found ');

  if (account?.employeeType === 'full-time') {
    final = employeeDetails.fullTime;
  } else if (account?.employeeShift === 'shift-1') {
    final = employeeDetails.partTimeShift1;
  } else if (account?.employeeShift === 'shift-2') {
    final = employeeDetails.partTimeShift2;
  } else {
    throw new ApiError(400, 'Invalid employee configuration');
  }

  // WARN: Change this
  // const final = req.user?.employeeType === 'full-time' ? employeeDetails.fullTime : employeeDetails.partTime;

  // const final = employeeDetails.fullTime;

  // const actualWorkHours = Number(timeDifference(attendance.inTime as Date, now).hours.toFixed(3));
  // const expectedTime = new Date(now);
  // expectedTime.setHours(final.expectedTime, 0, 0, 0);
  // const workHoursFromExpectedTime = Number(timeDifference(expectedTime, now).hours.toFixed(3));

  if (!attendance.inTime) throw new ApiError(400, 'Intime was not found ');

  const workHoursAndStatus = calculateWorkStatus({
    inTime: attendance.inTime,
    outTime: now,
    shift: final.shift,
  });

  // const workHours = Math.min(actualWorkHours, workHoursFromExpectedTime);

  const workHours = workHoursAndStatus.workHours;

  if (workHours === undefined || workHours === null)
    throw new ApiError(400, 'Work Hours Is Not Valid.');
  // const status =
  //   workHours === 0
  //     ? 'absent'
  //     : workHours > final.fullWorkHours - final.graceHours
  //       ? 'present'
  //       : 'half-day';

  const status = workHoursAndStatus.status;

  attendance.outTime = now;
  attendance.status = status;
  attendance.workHours = workHours;

  await attendance.save();

  const normalized = normalizeDoc(attendance.toObject());
  const parsed = AttendanceCheckOutSchema.parse(normalized);

  const cacheParsed = CheckOutSetCacheSchema.parse(normalized);
  if (!user?.id) throw new ApiError(400, 'Unauthorized');
  const todayKey = createKey('attendance', 'today', 'me', user?.id);
  await deleteCache(todayKey);
  await setCache(todayKey, cacheParsed, 14400);

  // await setCache()

  return ApiResponse.success(res, {
    message: 'Checked out successfully',
    data: parsed,
    statusCode: 200,
  });
};
