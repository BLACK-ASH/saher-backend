import type { Request, Response } from 'express';

import type { AttendanceListT } from './attendance.schema.js';
import { attendanceListSchema } from './attendance.schema.js';
import { getAccountByUser } from '../../admin/_services/account.js';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, getCache, setCacheWithGroup } from '../../libs/redis/redis-utils.js';
import { calculateWorkStatus, getShift } from '../../libs/utils/calculate-work-status.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { standardDateString } from '../../libs/utils/standard-date.js';

export const attendancetodayKey = (page: number, limit: number) => {
  return createKey('attendance', 'today', limit, page);
};

export const todayAttendanceController = async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Unauthorized');
  const userRole = req.user.role;
  if (userRole === 'user') throw new ApiError(400, 'Only admins and managers are permitted');

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const key = attendancetodayKey(page, limit);

  type CacheType = {
    message: string;
    data: AttendanceListT;
    statusCode: 200 | 201 | 202 | 204;
    meta: { page: number; limit: number; count: number; total: number };
  };

  const cached = await getCache<CacheType>(key);
  if (cached) {
    return ApiResponse.success(res, cached);
  }

  const now = new Date();
  const today = await Attendance.find({ date: standardDateString(now) })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name email role')
    .populate({
      path: 'user',
      populate: [{ path: 'image', model: 'Media' }],
    })
    .lean();

  const count = await Attendance.countDocuments({ date: standardDateString(now) });

  if (today.length === 0) {
    const emptyResponse = {
      message: 'Today is not a working day',
      data: null,
      statusCode: 200 as const,
      meta: { page, limit, count: 0, totalPages: 0 },
    };

    return ApiResponse.success(res, emptyResponse);
  }

  const finalToday = await Promise.all(
    today.map(async (obj) => {
      if (obj.inTime && !obj.outTime) {
        const account = await getAccountByUser(String(obj.user?._id ?? obj.user));
        if (account) {
          const shift = getShift(account);
          const { workHours } = calculateWorkStatus({
            inTime: obj.inTime,
            outTime: new Date(),
            shift,
          });
          obj.workHours = workHours;
        }
      }
      return obj;
    }),
  );

  const normalized = normalizeDoc(finalToday);
  const parsed = attendanceListSchema.parse(normalized);

  const response: CacheType = {
    message: 'Today Attendance',
    data: parsed,
    statusCode: 200,
    meta: {
      page,
      limit,
      count,
      total: Math.ceil(count / limit),
    },
  };

  await setCacheWithGroup(key, response, ['attendance', 'today', 'list']);
  await setCacheWithGroup(key, response, ['today']);

  return ApiResponse.success(res, response);
};
