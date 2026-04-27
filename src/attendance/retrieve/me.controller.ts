import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { standardDateString } from '../../libs/utils/standard-date.js';
import { createKey, getCache, setCache } from '../../libs/redis/redis-utils.js';
import z from 'zod';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { Account } from '../../database/account.model.js';
import { calculateWorkStatus, getShift } from '../../libs/utils/calculate-work-status.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { AttendanceResponseSchema, AttendanceSchemaFinal } from '../attendance.schema.js';
import { getAccount, getAccountByUser } from '../../admin/_services/account.js';

const AttendanceTodayMeSchema = AttendanceSchemaFinal.readonly();
const AttendanceTodayMeResponseSchema = AttendanceResponseSchema.omit({ user: true }).readonly();
export const meAttendanceController = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user?.id) throw new ApiError(400, 'Forbidden user');

  const now = new Date();

  const todayKey = createKey('attendance', 'today', 'me', user?.id);

  type AttendanceT = z.infer<typeof AttendanceTodayMeSchema>;
  const buildResponse = (data: AttendanceT, workHours: number) => {
    return AttendanceTodayMeResponseSchema.parse({ ...data, workHours });
  };

  const cachedToday = await getCache<AttendanceT>(todayKey);

  let responseData;
  // const account = await Account.findOne({ user: user?.id });
  // if (!account) throw new ApiError(400, 'Account not found');
  // const shift =
  //   account.employeeType === 'full-time'
  //     ? 'full-time'
  //     : account.employeeShift === 'shift-1'
  //       ? 'shift-1'
  //       : 'shift-2';
  const account = await getAccountByUser(user.id);
  if (!account) throw new ApiError(400, 'Account not found');

  const shift = getShift(account);

  if (cachedToday) {
    if (cachedToday.outTime !== null) {
      responseData = buildResponse(cachedToday, cachedToday.workHours);
      return ApiResponse.success(res, {
        message: 'data is Coming from Redis ',
        data: responseData,
        statusCode: 200,
      });
    }
    const result = calculateWorkStatus({ inTime: cachedToday.inTime, outTime: now, shift });
    const workHours = result.workHours;

    responseData = buildResponse(cachedToday, workHours);

    return ApiResponse.success(res, {
      message: 'data is Coming from Redis ',
      data: responseData,
      statusCode: 200,
    });
  }

  // const now = new Date();

  const today = await Attendance.findOne({ user: user?.id, date: standardDateString(now) }).lean();
  // const today = await record.lean();

  if (!today) {
    const data = {
      inTime: '',
      outTime: '',
      workHours: 0,
      date: standardDateString(now),
      status: '',
      isLate: false,
    };
    return ApiResponse.success(res, {
      message: 'Today is not working day',
      data: data,
      statusCode: 200,
    });
  }

  if (!today.inTime) {
    throw new ApiError(400, 'You have not yet checked in ');
  }

  const normalize = normalizeDoc(today);
  const parsed = AttendanceTodayMeSchema.parse(normalize);
  await setCache(todayKey, parsed, 14400);

  let workHours = today.workHours;

  if (today.workHours === 0) {
    // workHours = calculateWorkHours(account.employeeType, today.inTime);
    const result = calculateWorkStatus({ inTime: today.inTime, outTime: now, shift });
    workHours = result.workHours;
  }

  // WARN: eslint error hai isko thik kar
  responseData = buildResponse(parsed, workHours);

  return ApiResponse.success(res, {
    message: 'Today Attendance.',
    data: responseData,
    statusCode: 200,
  });
};
