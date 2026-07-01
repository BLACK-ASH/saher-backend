import type { Request, Response } from 'express';

import type { AttendanceResponseT } from './attendance.schema.js';
import { attendanceResponseSchema } from './attendance.schema.js';
import { getAccountByUser } from '../../admin/_services/account.js';
import { getUser } from '../../admin/_services/user.js';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, getCache, setCacheWithGroup } from '../../libs/redis/redis-utils.js';
import { calculateWorkStatus, getShift } from '../../libs/utils/calculate-work-status.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { standardDateString } from '../../libs/utils/standard-date.js';

export const defaultResponse = {
  inTime: null,
  outTime: null,
  workHours: 0,
  date: standardDateString(new Date()),
  overtime: false,
  status: 'absent',
  isLate: true,
};

export const meAttendanceController = async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(400, 'Forbidden user');
  const id = req.user.id;

  const user = await getUser(id);
  if (!user) throw new ApiError(400, 'Forbidden user');

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
    .populate('user')
    .populate({
      path: 'user',
      populate: [{ path: 'image', model: 'Media' }],
    })
    .lean();

  let data;

  if (!record) {
    data = attendanceResponseSchema.parse({ ...defaultResponse, id: 'test', user });
    const body = {
      message: 'today Attendance',
      data,
      meta: { reason: 'cron job not created' },
    };
    await setCacheWithGroup(todayKey, body, ['today']);
    return ApiResponse.success(res, body);
  }

  if (!record.inTime) {
    const normalized = await normalizeDoc(record);
    data = attendanceResponseSchema.parse(normalized);
    const body = {
      message: 'today Attendance',
      data,
    };
    await setCacheWithGroup(todayKey, body, ['today']);
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

  await setCacheWithGroup(todayKey, body, ['today']);
  return ApiResponse.success(res, body);
};
