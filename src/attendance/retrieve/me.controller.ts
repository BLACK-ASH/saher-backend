import { Request, Response } from 'express';
import { Attendance } from '../../database/attendance.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { standardDateString } from '../../libs/utils/standard-date.js';
import { calculateWorkHours } from '../../libs/utils/calculate-work-hours.js';
import { createKey, getCache, setCache } from '../../libs/redis/redis-utils.js';
import z from 'zod';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { Account } from '../../database/account.model.js';

export const meAttendanceController = async (req: Request, res: Response) => {
  const user = req.user;

  if (!user?.id) throw new ApiError(400, 'Forbidden user');
  // const cacheKeyToday = `attendance:me:${user?.id}:today`;
  const todayKey = createKey('attendance', 'today', 'me', user?.id);

  const AttendanceSchemaFinal = z
    .object({
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
    })
    .readonly();

  const AttendanceResponseSchema = z.object({
    inTime: z.string(),
    outTime: z.string().nullable().optional(),
    workHours: z.number(),
    date: z.string(),
    status: z.string(),
    isLate: z.boolean(),
  });

  type AttendanceT = z.infer<typeof AttendanceSchemaFinal>;
  const buildResponse = (data: AttendanceT, workHours: number) => {
    return AttendanceResponseSchema.parse({ ...data, workHours });
  };
  // const cacheKeyTodayWorkHours = `attendance:me:${user?.id}:today:workHours`;
  // const todayWorkHoursKey = createKey('attendance', 'me', user?.id, 'today', 'workHours');

  const cachedToday = await getCache<AttendanceT>(todayKey);

  const account = await Account.findOne({ user: user?.id });
  if (!account) throw new ApiError(400, 'Account not found');

  let responseData;
  if (cachedToday) {
    const workHours = calculateWorkHours(account.employeeType, new Date(cachedToday.inTime));

    responseData = buildResponse(cachedToday, workHours);
    // responseData = AttendanceResponseSchema.parse({
    //   inTime : cachedToday.inTime,
    //   outTime : cachedToday.outTime,
    //   workHours : workHours ,
    //   date : cachedToday.date ,
    //   status : cachedToday.status,
    //   isLate : cachedToday.isLate
    // })

    return res.status(200).json({
      message: 'data is Coming from Redis ',
      success: true,
      data: responseData,
    });
  }

  const now = new Date();

  const today = await Attendance.findOne({ user: user?.id, date: standardDateString(now) }).lean();

  if (!today) {
    throw new ApiError(404, 'Today record not found');
  }
  if (!today.inTime) {
    throw new ApiError(400, 'You have not yet checked in ');
  }

  const normalize = normalizeDoc(today);
  const parsed = AttendanceSchemaFinal.parse(normalize);
  await setCache(todayKey, parsed, 14400);

  let workHours = today.workHours;

  if (today.workHours === 0) {
    workHours = calculateWorkHours(account.employeeType, today.inTime);
  }

  // responseData = AttendanceResponseSchema.parse({
  //     inTime : parsed.inTime,
  //     outTime : parsed.outTime,
  //     workHours : workHours ,
  //     date : parsed.date ,
  //     status : parsed.status,
  //     isLate : parsed.isLate
  //   })
  responseData = buildResponse(parsed, workHours);

  return res.status(200).json({
    message: 'data from DB ',
    success: true,
    data: responseData,
  });
};
