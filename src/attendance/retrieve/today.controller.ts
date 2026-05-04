import type { Request, Response } from 'express';

import type { AttendanceListT } from './attendance.schema.js';
import { attendanceListSchema } from './attendance.schema.js';
import { defaultResponse } from './me.controller.js';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { standardDateString } from '../../libs/utils/standard-date.js';

export const attendancetodayKey = (page: number, limit: number) => {
  return createKey('attendance', 'today', `page:${page}`, `limit:${limit}`);
};

export const todayAttendanceController = async (req: Request, res: Response) => {
  const userRole = req.user?.role;
  if (userRole === 'user') throw new ApiError(400, 'Only admins and managers are permitted');

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const key = attendancetodayKey(page, limit);

  type CacheType = {
    data: AttendanceListT;
    meta: { page: number; limit: number; count: number; total: number };
  };

  const cached = await getCache<CacheType>(key);
  if (cached) {
    const response = attendanceListSchema.parse(cached.data);

    return ApiResponse.success(res, {
      message: 'Today record  ',
      data: response,
      statusCode: 200,
      meta: cached.meta,
    });
  }

  const now = new Date();
  const today = await Attendance.find({ date: standardDateString(now) })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name email role')
    .lean();

  const count = await Attendance.countDocuments({ date: standardDateString(now) });

  // if (today.length === 0) {
  //     const emptyResponse: CacheType = { data: defaultResponse, meta: { page, limit, count: 0, total: 0 } }
  // }

  if (today.length === 0) {
    const emptyResponse = {
      data: defaultResponse,
      meta: { page, limit, count: 0, total: 0 },
    };

    return ApiResponse.success(res, {
      message: 'Today is not a working day',
      data: emptyResponse,
      statusCode: 200,
      meta: emptyResponse.meta,
    });
  }

  const normalized = normalizeDoc(today);
  const parsed = attendanceListSchema.parse(normalized);

  const response: CacheType = {
    data: parsed,
    meta: {
      page,
      limit,
      count,
      total: Math.ceil(count / limit),
    },
  };

  await setCache(key, response, 86400);

  return ApiResponse.success(res, {
    message: 'Today Attendance',
    data: parsed,
    statusCode: 200,
    meta: response.meta,
  });
};
