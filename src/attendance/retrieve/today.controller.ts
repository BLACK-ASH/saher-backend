import type { Request, Response } from 'express';

import type { AttendanceListT } from './attendance.schema.js';
import { attendanceListSchema } from './attendance.schema.js';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, getCache, setCacheWithGroup } from '../../libs/redis/redis-utils.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { standardDateString } from '../../libs/utils/standard-date.js';

export const attendancetodayKey = (page: number, limit: number) => {
  return createKey('attendance', 'today', limit, page);
};

export const todayAttendanceController = async (req: Request, res: Response) => {
  const userRole = req.user?.role;
  if (userRole === 'user') throw new ApiError(400, 'Only admins and managers are permitted');

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const key = attendancetodayKey(page, limit);

  type CacheType = {
    message: string;
    data: AttendanceListT;
    statusCode: number;
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
      statusCode: 200,
      meta: { page, limit, count: 0, totalPages: 0 },
    };

    return ApiResponse.success(res, emptyResponse);
  }

  const finalToday = today.map((obj) => {
    if (obj.inTime) {
      const now = new Date();
      obj.workHours = Number(
        ((now.getTime() - obj.inTime.getTime()) / (1000 * 60 * 60)).toFixed(2),
      );
    }
    return obj;
  });

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
  await setCacheWithGroup(key, response, ['attendance', 'today']);

  return ApiResponse.success(res, response);
};
