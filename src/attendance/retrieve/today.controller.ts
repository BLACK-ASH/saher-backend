import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { standardDateString } from '../../libs/utils/standard-date.js';
import z from 'zod';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { createKey, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { AttendanceResponseSchema, AttendanceSchemaFinal } from './me.controller.js';

const attendanceTodayResponseSchema = z
  .array(AttendanceResponseSchema.omit({ workHours: true }).extend({ user: z.string() }))
  .readonly();

export const attendancetodayKey = createKey('attendance', 'today');
export const todayAttendanceController = async (req: Request, res: Response) => {
  const userRole = req.user?.role;
  if (userRole === 'user') throw new ApiError(400, 'Only admins and managers are permitted');

  type AttendanceT = z.infer<typeof attendanceTodayResponseSchema>;

  const cached = await getCache<AttendanceT>(attendancetodayKey);
  let response;
  if (cached) {
    response = attendanceTodayResponseSchema.parse(cached);
    return res
      .status(200)
      .json({ success: true, message: 'The data is coming from redis ', data: response });
  }

  const now = new Date();
  const today = await Attendance.find({ date: standardDateString(now) }).lean();
  if (today.length === 0) {
    const data = { user: null, inTime: '', outTime: '', status: '' };
    return res
      .status(200)
      .json({ success: true, message: 'Today is not a working day', data: data });
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

  await setCache(attendancetodayKey, updatedToday, 86400);
  return res.status(200).json({ success: true, message: 'Today Attendance.', data: updatedToday });
};
