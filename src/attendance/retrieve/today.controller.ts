import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { standardDateString } from '../../libs/utils/standard-date.js';
import z from 'zod';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { createKey, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { AttendanceResponseSchema, AttendanceSchemaFinal } from './me.controller.js';
import { ApiResponse } from '../../libs/class/api-response.js';

const attendanceTodayResponseSchema = z
  .array(AttendanceResponseSchema.omit({ workHours: true }).extend({ user: z.string() }))
  .readonly();

export const attendancetodayKey = (page: number, limit: number) => {
  return createKey('attendance', 'today', `page:${page}`, `limit:${limit}`);
};

export const todayAttendanceController = async (req: Request, res: Response) => {
  const userRole = req.user?.role;
  if (userRole === 'user') throw new ApiError(400, 'Only admins and managers are permitted');

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 1;
  const skip = (page - 1) * limit;

  const key = attendancetodayKey(page, limit);

  type AttendanceT = z.infer<typeof attendanceTodayResponseSchema>;

  const cached = await getCache<AttendanceT>(key);
  let response;
  if (cached) {
    response = attendanceTodayResponseSchema.parse(cached);
    return ApiResponse.success(res, {
      message: 'The data is coming from redis ',
      data: response,
      statusCode: 200,
    });
  }

  const now = new Date();
  const today = await Attendance.find({ date: standardDateString(now) })
    .skip(skip)
    .limit(limit)
    .lean();
  if (today.length === 0) {
    const data = { user: null, inTime: '', outTime: '', status: '' };
    return ApiResponse.success(res, {
      message: 'Today is not a working day',
      data: data,
      statusCode: 200,
    });
  }

  const singleResponseSchema = AttendanceResponseSchema.omit({ workHours: true }).extend({
    user: z.string(),
  });

  const updatedToday = today.map((record) => {
    const normalizeRecord = normalizeDoc(record);
    const parsed = AttendanceSchemaFinal.parse(normalizeRecord);
    response = singleResponseSchema.parse({ ...parsed, user: parsed.user?.toString() });
    return response;
  });

  await setCache(key, updatedToday, 86400);
  return ApiResponse.success(res, {
    message: 'Today Attendance.',
    data: today,
    statusCode: 200,
  });
};
