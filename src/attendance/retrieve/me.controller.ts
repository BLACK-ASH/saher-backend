import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { standardDateString } from '../../libs/utils/standard-date.js';
import { calculateWorkHours } from '../../libs/utils/calculate-work-hours.js';
import { createKey, getCache, setCache } from '../../libs/redis/redis-utils.js';
import z from 'zod';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { Account } from '../../database/account.model.js';

export const AttendanceSchemaFinal = z.object({
  id: z.string(),
  user: z.string(),
  inTime: z.string(),
  outTime: z.string().optional().nullable(),
  workHours: z.number(),
  date: z.string(),
  status: z.string(),
  isLate: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AttendanceResponseSchema = z.object({
  user: z.string(),
  inTime: z.string(),
  outTime: z.string().nullable().optional(),
  workHours: z.number(),
  date: z.string(),
  status: z.string(),
  isLate: z.boolean(),
});

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
  const account = await Account.findOne({ user: user?.id });
  if (!account) throw new ApiError(400, 'Account not found');
  if (cachedToday) {
    const workHours = calculateWorkHours(account.employeeType, new Date(cachedToday.inTime));

    responseData = buildResponse(cachedToday, workHours);

    return res.status(200).json({
      message: 'data is Coming from Redis ',
      success: true,
      data: responseData,
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
    return res.status(200).json({ success: true, message: 'Today is not working day', data: data });
  }

  if (!today.inTime) {
    throw new ApiError(400, 'You have not yet checked in ');
  }

  const normalize = normalizeDoc(today);
  const parsed = AttendanceTodayMeSchema.parse(normalize);
  await setCache(todayKey, parsed, 14400);

  let workHours = today.workHours;

  if (today.workHours === 0) {
    workHours = calculateWorkHours(account.employeeType, today.inTime);
  }

  responseData = buildResponse(parsed, workHours);

  return res.status(200).json({
    message: 'data from DB ',
    success: true,
    data: responseData,
  });
};
