import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { standardDateString } from '../../libs/utils/standard-date.js';
import { createKey, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { calculateWorkStatus, getShift } from '../../libs/utils/calculate-work-status.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { attendanceResponseSchema, AttendanceResponseT } from './attendance.schema.js';
import { getAccountByUser } from '../../admin/_services/account.js';

export const defaultResponse = {
  inTime: null,
  outTime: null,
  workHours: 0,
  date: standardDateString(new Date()),
  status: 'absent',
  isLate: true,
};

export const meAttendanceController = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user?.id) throw new ApiError(400, 'Forbidden user');

  const todayKey = createKey('attendance', 'today', 'me', user?.id);

  const cachedData = await getCache<{
    message: string;
    data: AttendanceResponseT;
    meta?: { reason: string };
  }>(todayKey);

  if (cachedData) {
    return ApiResponse.success(res, cachedData);
  }

  const now = new Date();

  const record = await Attendance.findOne({ user: user.id, date: standardDateString(now) })
    .populate('user', 'name email role')
    .lean();

  let data;

  if (!record) {
    data = attendanceResponseSchema.parse({ ...defaultResponse, id: 'test', user });
    const body = {
      message: 'today Attendance',
      data,
      meta: { reason: 'cron job not created' },
    };
    await setCache(todayKey, body);
    return ApiResponse.success(res, body);
  }

  if (!record.inTime) {
    const normalized = await normalizeDoc(record);
    data = attendanceResponseSchema.parse(normalized);
    const body = {
      message: 'today Attendance',
      data,
    };
    await setCache(todayKey, body);
    return ApiResponse.success(res, body);
  }

  const account = await getAccountByUser(user.id);
  if (!account) throw new ApiError(400, 'Account not found');

  const shift = getShift(account);

  const { workHours, status } = calculateWorkStatus({
    inTime: record.inTime,
    outTime: record.outTime || now,
    shift,
  });

  const normalized = await normalizeDoc({ ...record, workHours, status });
  data = attendanceResponseSchema.parse(normalized);

  const body = {
    message: 'today Attendance',
    data,
  };

  await setCache(todayKey, body);
  return ApiResponse.success(res, body);
};
